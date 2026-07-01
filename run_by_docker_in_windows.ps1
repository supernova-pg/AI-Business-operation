<#
.SYNOPSIS
Builds and runs the AI Business Operations project using Docker on Windows.

.DESCRIPTION
This script verifies that Docker is running, then executes docker-compose up --build -d 
to spin up the application, Postgres, and MongoDB. It then shows the logs of the app container.
#>

# Check if Docker is installed and running
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Docker is not running or not installed. Please start Docker Desktop." -ForegroundColor Red
        Exit
    }
} catch {
    Write-Host "Error: Docker is not running or not installed. Please start Docker Desktop." -ForegroundColor Red
    Exit
}

Write-Host "Docker is running! Starting the build process..." -ForegroundColor Cyan

# Run docker-compose up --build -d
Write-Host "Running: docker-compose up --build -d" -ForegroundColor Yellow
docker-compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "Containers started successfully!" -ForegroundColor Green
    Write-Host "The application will be available at: http://localhost:3000" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    
    # Optional: Follow logs of the app
    Write-Host "Showing logs for the app container (Press Ctrl+C to stop viewing logs)..." -ForegroundColor Cyan
    docker-compose logs -f app
} else {
    Write-Host "There was an error starting the containers. Please check the output above." -ForegroundColor Red
}
