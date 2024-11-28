# Shopify Welcome Modal App

Este aplicativo permite adicionar um modal de boas-vindas personalizável à sua loja Shopify.

## Configuração

1. Clone este repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo `.env`:
- SHOPIFY_API_KEY: Sua API Key do Shopify Partners
- SHOPIFY_API_SECRET: Seu API Secret do Shopify Partners
- SHOP_NAME: Nome da sua loja
- HOST: Seu domínio (shopify.moxxy.com.br)
- DATABASE_URL: URL de conexão do PostgreSQL

4. Inicie o servidor:
```bash
npm start
```

## Funcionalidades

- Painel de administração para configurar o modal
- Personalização de título, conteúdo e botão
- Ativação/desativação do modal
- Integração automática com a loja Shopify

## Banco de Dados

O aplicativo utiliza PostgreSQL para armazenar as configurações do modal. A estrutura do banco de dados é criada automaticamente ao iniciar o servidor.

## Uso

1. Acesse o painel de administração em `https://shopify.moxxy.com.br/admin`
2. Configure as opções do modal
3. O modal será exibido automaticamente na sua loja Shopify quando ativo

## Suporte

Para suporte, entre em contato através do email de suporte.
