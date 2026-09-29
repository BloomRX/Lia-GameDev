"""Testes do núcleo da Lia GameDev (stdlib only, offline, sem serviços externos).

Execute com:  python -m pytest tests/   ou   python tests/test_core.py
"""
import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app.lia import (  # noqa: E402
    storage, bootstrap, planning, conflicts, qa, release, providers, engines,
)


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="lia_test_")
        self.store = storage.Storage(Path(self.tmp))

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)


class TestStorage(Base):
    def test_create_list_get(self):
        e = self.store.create_project("Meu Jogo")
        self.assertEqual(len(self.store.list_projects()), 1)
        self.assertIsNotNone(self.store.get_entry(e["id"]))
        self.assertTrue((self.store.projects_dir / e["folder"]).exists())

    def test_docs_and_structured(self):
        e = self.store.create_project("Doc Test")
        self.store.write_doc(e["id"], "PROJECT_BRIEF.md", "# oi")
        self.assertEqual(self.store.read_doc(e["id"], "PROJECT_BRIEF.md"), "# oi")
        self.store.write_structured(e["id"], "decisions.json", [{"topic": "x", "label": "confirmado", "value": "y"}])
        self.assertEqual(self.store.read_structured(e["id"], "decisions.json")[0]["value"], "y")

    def test_archive_reopen_delete_requires_confirm(self):
        e = self.store.create_project("Del")
        self.store.archive_project(e["id"])
        self.assertTrue(self.store.get_entry(e["id"])["archived"])
        self.store.reopen_project(e["id"])
        self.assertFalse(self.store.get_entry(e["id"])["archived"])
        with self.assertRaises(storage.StorageError):
            self.store.delete_project(e["id"])  # sem confirm
        self.store.delete_project(e["id"], confirm=True)
        self.assertIsNone(self.store.get_entry(e["id"]))

    def test_path_traversal_blocked(self):
        e = self.store.create_project("X")
        with self.assertRaises(storage.StorageError):
            self.store.write_doc(e["id"], "../evil.md", "x")

    def test_export(self):
        e = self.store.create_project("Exp")
        dest = os.path.join(self.tmp, "exp_out")
        out = self.store.export_project(e["id"], dest)
        self.assertTrue(Path(out).exists())


class TestBootstrap(Base):
    def test_incomplete_idea_no_invented_confirmed(self):
        e = self.store.create_project("Incompleto")
        # só a ideia; sem público, plataforma, pilares
        res = bootstrap.run_bootstrap(self.store, e["id"], {"idea": "voar entre ilhas"})
        decs = self.store.read_structured(e["id"], "decisions.json")
        confirmed = [d for d in decs if d["label"] == "confirmado"]
        open_ = [d for d in decs if d["label"] == "em aberto"]
        self.assertTrue(any(d["topic"] == "Público" and d["label"] == "em aberto" for d in decs))
        self.assertTrue(any(d["topic"] == "Plataforma" and d["label"] == "em aberto" for d in decs))
        # nenhuma decisão "confirmado" inventada para campos não informados
        self.assertFalse(any(d["topic"] in ("Público", "Plataforma") and d["label"] == "confirmado" for d in decs))
        # docs gerados
        for doc in res["docs"]:
            self.assertTrue(self.store.read_doc(e["id"], doc).strip())

    def test_full_idea_labels(self):
        e = self.store.create_project("Cheio")
        bootstrap.run_bootstrap(self.store, e["id"], {
            "idea": "cultivar ilhas", "experience": "paz", "audience": "casuais 12+",
            "platform": "PC", "pillars": ["calma", "mistério"], "restrictions": "1 pessoa",
        })
        decs = self.store.read_structured(e["id"], "decisions.json")
        self.assertTrue(any(d["topic"] == "Público" and d["label"] == "confirmado" for d in decs))
        self.assertTrue(any(d["topic"] == "Plataforma" and d["label"] == "confirmado" for d in decs))


class TestConflicts(Base):
    def test_confirmed_vs_suposicao_conflict(self):
        decs = [
            {"topic": "Plataforma", "label": "confirmado", "value": "mobile (toque)"},
            {"topic": "Plataforma", "label": "suposição", "value": "PC (Windows)"},
        ]
        c = conflicts.detect_conflicts(decs)
        self.assertEqual(len(c), 1)
        self.assertEqual(c[0]["topic"], "plataforma")

    def test_no_false_conflict(self):
        decs = [
            {"topic": "Plataforma", "label": "confirmado", "value": "PC"},
            {"topic": "Plataforma", "label": "em aberto", "value": ""},
        ]
        self.assertEqual(conflicts.detect_conflicts(decs), [])


class TestPlanning(Base):
    def test_module_task_resume(self):
        e = self.store.create_project("Plan")
        m = planning.create_module(self.store, e["id"], {"name": "M1", "acceptance": ["a"]})
        t = planning.create_task(self.store, e["id"], m["id"], {"name": "T1", "objective": "fazer", "verify": "teste"})
        planning.update_task(self.store, e["id"], m["id"], t["id"], {"status": "em andamento"})
        modules = planning.get_modules(self.store, e["id"])
        self.assertEqual(len(modules), 1)
        self.assertEqual(modules[0]["tasks"][0]["status"], "em andamento")
        res = planning.build_resume(self.store, e["id"])
        self.assertIn("Plan", res["summary"])
        self.assertEqual(len(res["open_tasks"]), 1)
        self.assertEqual(res["open_tasks"][0]["name"], "T1")


class TestQaRelease(Base):
    def test_qa_record(self):
        e = self.store.create_project("Q")
        rec = qa.add_verification(self.store, e["id"], {"target": "slice", "criteria": "carrega", "result": "planejado"})
        self.assertEqual(qa.get_verifications(self.store, e["id"])[0]["id"], rec["id"])

    def test_release_defaults(self):
        e = self.store.create_project("R")
        rel = release.get_release(self.store, e["id"])
        self.assertFalse(rel["published"])
        self.assertTrue(len(rel["checklist"]) > 0)


class TestProvidersEngines(Base):
    def test_providers_simulated_not_connected(self):
        cat = providers.provider_catalog()
        self.assertTrue(all(p["simulated"] for p in cat))
        self.assertTrue(all(p["status"] == "not_connected" for p in cat))
        rt = providers.describe_runtime(self.store)
        self.assertFalse(rt["connected"])
        self.assertTrue(rt["simulated"])

    def test_engines_generic_verified(self):
        e = self.store.create_project("E")
        cat = engines.get_catalog()
        self.assertTrue(any(x["id"] == "generic" and x["verified"] for x in cat))
        prof = engines.set_profile(self.store, e["id"], "godot")
        self.assertFalse(prof["verified"])


class TestSkillReuse(Base):
    def test_skill_templates_present(self):
        import app.lia.templates_loader as tl
        self.assertTrue(tl.skill_exists())
        self.assertIn("PROJECT_BRIEF.md", tl.list_templates())


if __name__ == "__main__":
    unittest.main(verbosity=2)
