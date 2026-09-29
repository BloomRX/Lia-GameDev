# Limites de segurança/permissões e tratamento de credenciais

## Princípios
- Ações destrutivas, externas ou irreversíveis exigem confirmação explícita.
- Execução assistida separa **proposta → aprovação → execução**.
- Nada é conectado a serviço pago por padrão.

## O que o app NÃO faz (por design nesta alpha)
- Não instala runtimes/modelos, não cria contas, não adquire créditos.
- Não chama APIs pagas, não faz upload de código/projetos/logs/dados a serviço externo.
- Não publica, não compra asset, não envia build.
- Não consulta nem altera memórias pessoais da Lia Waifu.
- Não embute chaves/tokens no código, logs ou repositório.

## Credenciais (futuro)
- Se um provedor for conectado, a chave deve vir do próprio Dev (campo em Configurações),
  preferencialmente via armazenamento seguro do sistema. Nunca em texto puro sem aviso e
  consentimento. Nenhuma credencial existe nem é solicitada nesta entrega.

## Permissões de tarefa
- Cada tarefa registra `permissions` (ex.: escrever arquivo, rodar comando, Git). A UI
  mostra permissões antes de aprovar. Nesta alpha a execução é simulada, então nenhuma
  dessas ações reais é executada.

## Validação de informação volátil
- Preços/quotas/regiões citados em provedores trazem fonte e data e **não** prometem
  gratuidade permanente.
