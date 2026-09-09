# PROJECT_CONTEXT.md

## Projeto: rAthena (MMORPG Server)

### Descrição
Rathena é um servidor MMORPG baseado em Ragnarok Online, escrito em C++. É um projeto open-source de desenvolvimento colaborativo de um pacote de servidor robusto.

### Localização
```
C:\Users\leona\OneDrive\Área de Trabalho\Heleonaire\rathena-master\
```

### Estado Atual
- **Projeto extraído**: Sim (via `git clone`)
- **Compiladores instalados**: Nenhum
- **Makefile gerado**: Não
- **Build executado**: Não
- **Servidor iniciado**: Não

### Estrutura do Projeto
```
rathena-master/
├── athena-start          # Script principal para iniciar servidores
├── configure             # Script de configuração (autoconf)
├── configure.ac          # Definições do configure
├── CMakeLists.txt        # Definição para builds com CMake
├── function.sh           # Funções auxiliares para athena-start
├── Makefile.in           # Template do Makefile
├── src/                  # Código fonte (arquivos .cpp e .hpp)
├── conf/                 # Arquivos de configuração
│   ├── battle/           # Configurações de batalha
│   ├── import/           # Overriding de configurações
│   ├── import-tmpl/      # Templates para import
│   └── *.conf            # Vários arquivos de configuração
├── db/                   # Arquivos de banco de dados
├── npc/                  # Scripts de NPCs
├── sql-files/            # Scripts SQL para banco de dados
└── doc/                  # Documentação
```

### Servidores do Sistema
O rAthena utiliza 4 servidores principais:

| Servidor | Nome | Função |
|----------|------|--------|
| Login | `login-server` | Autenticação de jogadores |
| Character | `char-server` | Gerenciamento de personagens |
| Map | `map-server` | Lógica do jogo e mapas |
| Web | `web-server` | Interface web/API |

### Scripts de Início
- **athena-start**: Script principal para gerenciar servidores
  - `athena-start start` - Inicia todos os servidores
  - `athena-start stop` - Para todos os servidores
  - `athena-start restart` - Reinicia servidores
  - `athena-start status` - Verifica status
  - `athena-start watch` - Monitora e reinicia automaticamente

### Requisitos de Sistema

#### Hardware
| Tipo | Mínimo | Recomendado |
|------|--------|-------------|
| CPU | 1 Core | 2 Cores |
| RAM | 1 GB | 2 GB |
| Disco | 300 MB | 500 MB |

#### Software Necessário
- **Compilador**: MSVC++ Build Tools (Visual Studio 2027+) ou GCC (Linux)
- **Banco de Dados**: MySQL 5+ ou MariaDB 5+
- **Git**: Para controle de versão
- **Make**: Para compilação

#### Prerequisites Identificados
1. **MSVC++ Build Tools** - Não instalado (precisa ser instalado)
2. **Git for Windows** - Necessário para clonar o repositório
3. **MySQL/MariaDB** - Banco de dados para persistência

### Configuração

#### Passos para Build
1. Instalar MSVC++ Build Tools com workload "Desktop development with C++"
2. Rodar `./configure` para gerar Makefile
3. Rodar `make` para compilar
4. Configurar arquivos em `conf/`
5. Iniciar com `athena-start start`

#### Configuração de Banco de Dados
- Scripts SQL em `sql-files/`
- Configuração em `conf/inter_athena.conf` ou `conf/inter_server.yml`

### Arquivos de Configuração Principais

| Arquivo | Descrição |
|---------|----------|
| `conf/login_athena.conf` | Configuração do servidor de login |
| `conf/char_athena.conf` | Configuração do servidor de personagem |
| `conf/map_athena.conf` | Configuração do servidor de mapa |
| `conf/battle/battle.conf` | Mecânicas de batalha |
| `conf/inter_athena.conf` | Comunicação entre servidores |

### Import System
O diretório `conf/import/` permite sobrescrever configurações sem modificar os arquivos originais, facilitando atualizações do projeto.

### Documentação
- `README.md` - Instruções de instalação
- `doc/` - Documentação detalhada sobre NPCs, atcommands, permissões de grupos
- `conf/readme.md` - Sistema de import de configurações
- `db/readme.md` - Sistema de import de banco de dados

### Próximos Passos
1. Instalar MSVC++ Build Tools via chocolatey ou download direto
2. Configurar banco de dados MySQL/MariaDB
3. Rodar `./configure` e `make`
4. Configurar arquivos de configuração conforme necessário
5. Iniciar servidores com `athena-start start --enlog`

### Links Úteis
- [Wiki Oficial](https://github.com/rathena/rathena/wiki)
- [Fórum](https://rathena.org/board)
- [Discord](https://rathena.org/discord)
- [FluxCP](https://github.com/rathena/FluxCP) - Sistema de gerenciamento web

### Licença
GNU General Public License v3.0 (GPLv3)

---
*Arquivo gerado automaticamente pelo assistente de desenvolvimento*
