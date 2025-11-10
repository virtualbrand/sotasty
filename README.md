# CakeCloud 🍰

Sistema completo de gestão para confeitarias desenvolvido com Next.js, React, Supabase e Tailwind CSS.

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **React** - Biblioteca para interfaces
- **TypeScript** - Tipagem estática
- **Supabase** - Backend as a Service (autenticação e banco de dados)
- **Tailwind CSS** - Framework CSS utilitário

## 📋 Funcionalidades

- ✅ Gestão de Produtos (bolos, doces, etc)
- ✅ Controle de Pedidos
- ✅ Cadastro de Clientes
- ✅ Interface moderna e responsiva
- ✅ Autenticação com Supabase

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone git@github.com:virtualbrand/cakecloud.git
cd cakecloud
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Renomeie `.env.local` e adicione suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

4. Execute o projeto:
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📦 Estrutura do Projeto

```
cakecloud/
├── app/                    # Páginas do Next.js (App Router)
│   ├── products/          # Gestão de produtos
│   ├── orders/            # Controle de pedidos
│   ├── customers/         # Cadastro de clientes
│   └── layout.tsx         # Layout principal
├── components/            # Componentes React reutilizáveis
├── lib/                   # Utilitários e configurações
│   └── supabase/         # Clientes Supabase
├── types/                 # Tipos TypeScript
└── public/               # Arquivos estáticos

```

## 🗄️ Banco de Dados (Supabase)

O projeto utiliza Supabase para gerenciar:
- Autenticação de usuários
- Banco de dados PostgreSQL
- Storage para imagens

### Tabelas principais:
- `products` - Produtos da confeitaria
- `orders` - Pedidos dos clientes
- `order_items` - Itens de cada pedido
- `customers` - Cadastro de clientes

## 🎨 Design

O sistema utiliza uma paleta de cores moderna com foco em:
- Rosa/Pink como cor principal
- Interface limpa e intuitiva
- Design responsivo para mobile e desktop

## 📝 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run start    # Inicia servidor de produção
npm run lint     # Executa linter
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🔗 Links Úteis

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)

---

Desenvolvido com ❤️ para confeitarias
