# ============================================================
# Oliveira Apply AI — Setup para Windows (PowerShell)
# ============================================================
param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host ""
    Write-Host "  Oliveira Apply AI — Comandos disponiveis:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  .\start.ps1 setup       # Roda tudo do zero (primeira vez)" -ForegroundColor Green
    Write-Host "  .\start.ps1 dev         # Inicia backend + frontend" -ForegroundColor Green
    Write-Host "  .\start.ps1 install     # Instala dependencias npm" -ForegroundColor Green
    Write-Host "  .\start.ps1 docker-up   # Sobe Postgres + Redis" -ForegroundColor Green
    Write-Host "  .\start.ps1 docker-down # Para os containers" -ForegroundColor Green
    Write-Host "  .\start.ps1 migrate     # Cria tabelas no banco" -ForegroundColor Green
    Write-Host "  .\start.ps1 seed        # Popula dados de exemplo" -ForegroundColor Green
    Write-Host "  .\start.ps1 build       # Build de producao" -ForegroundColor Green
    Write-Host "  .\start.ps1 studio      # Abre Prisma Studio (GUI do banco)" -ForegroundColor Green
    Write-Host ""
}

function Invoke-DockerUp {
    Write-Host "Subindo Postgres + Redis..." -ForegroundColor Cyan
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { Write-Host "Erro ao subir containers. Verifique se o Docker Desktop esta rodando." -ForegroundColor Red; exit 1 }
    Write-Host "Aguardando banco ficar pronto..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    Write-Host "Containers prontos!" -ForegroundColor Green
}

function Invoke-DockerDown {
    Write-Host "Parando containers..." -ForegroundColor Cyan
    docker compose down
}

function Invoke-Install {
    Write-Host "Instalando dependencias do backend..." -ForegroundColor Cyan
    Set-Location backend
    npm install
    Set-Location ..

    Write-Host "Instalando dependencias do frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm install
    Set-Location ..

    Write-Host "Dependencias instaladas!" -ForegroundColor Green
}

function Invoke-Migrate {
    Write-Host "Rodando migracoes do banco..." -ForegroundColor Cyan
    Set-Location backend
    npx prisma migrate dev --name init
    Set-Location ..
    Write-Host "Migracoes concluidas!" -ForegroundColor Green
}

function Invoke-Seed {
    Write-Host "Populando banco com dados de exemplo..." -ForegroundColor Cyan
    Set-Location backend
    npx prisma db seed
    Set-Location ..
    Write-Host "Seed concluido!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Login admin:  admin@oliveira-apply.ai / Admin@123" -ForegroundColor Yellow
    Write-Host "  Login demo:   demo@oliveira-apply.ai  / Demo@123" -ForegroundColor Yellow
}

function Invoke-Dev {
    Write-Host "Iniciando backend e frontend em modo dev..." -ForegroundColor Cyan
    Write-Host "  Backend:  http://localhost:3001" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pressione Ctrl+C para parar." -ForegroundColor Gray

    # Abre o backend em nova janela PowerShell
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"

    # Roda o frontend na janela atual
    Set-Location frontend
    npm run dev
    Set-Location ..
}

function Invoke-Build {
    Write-Host "Build de producao..." -ForegroundColor Cyan
    Set-Location backend
    npm run build
    Set-Location ..
    Set-Location frontend
    npm run build
    Set-Location ..
    Write-Host "Build concluido!" -ForegroundColor Green
}

function Invoke-Studio {
    Write-Host "Abrindo Prisma Studio..." -ForegroundColor Cyan
    Set-Location backend
    npx prisma studio
    Set-Location ..
}

function Invoke-Setup {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "  Oliveira Apply AI — Setup completo" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""

    # Verifica pre-requisitos
    Write-Host "Verificando pre-requisitos..." -ForegroundColor Yellow

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "ERRO: Docker nao encontrado. Instale Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Red
        exit 1
    }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "ERRO: Node.js nao encontrado. Instale em: https://nodejs.org" -ForegroundColor Red
        exit 1
    }

    $nodeVersion = (node --version).Replace("v","").Split(".")[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Host "ERRO: Node.js 18+ necessario. Versao atual: $(node --version)" -ForegroundColor Red
        exit 1
    }

    Write-Host "Node $(node --version) OK" -ForegroundColor Green
    Write-Host "Docker OK" -ForegroundColor Green
    Write-Host ""

    # Cria arquivos .env se nao existirem
    if (-not (Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "backend\.env criado a partir do .env.example" -ForegroundColor Yellow
        Write-Host "IMPORTANTE: Edite backend\.env com suas chaves de API antes de continuar!" -ForegroundColor Red
        Write-Host "Abrindo o arquivo para edicao..." -ForegroundColor Yellow
        Start-Process notepad "backend\.env"
        Read-Host "Pressione Enter apos editar o .env para continuar"
    }
    if (-not (Test-Path "frontend\.env.local")) {
        Copy-Item "frontend\.env.example" "frontend\.env.local"
        Write-Host "frontend\.env.local criado" -ForegroundColor Yellow
    }

    Invoke-DockerUp
    Invoke-Install
    Invoke-Migrate
    Invoke-Seed

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  Setup concluido! Para iniciar:" -ForegroundColor Green
    Write-Host "  .\start.ps1 dev" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
}

# Router de comandos
switch ($Command) {
    "help"       { Show-Help }
    "setup"      { Invoke-Setup }
    "install"    { Invoke-Install }
    "docker-up"  { Invoke-DockerUp }
    "docker-down"{ Invoke-DockerDown }
    "migrate"    { Invoke-Migrate }
    "seed"       { Invoke-Seed }
    "dev"        { Invoke-Dev }
    "build"      { Invoke-Build }
    "studio"     { Invoke-Studio }
    default      { Write-Host "Comando desconhecido: $Command" -ForegroundColor Red; Show-Help }
}
