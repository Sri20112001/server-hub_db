// ServerHub CI/CD — Jenkins declarative pipeline.
// Prerequisites: Docker + Compose, Go >= 1.24, Node 22 LTS.
pipeline {
  agent any

  options {
    timestamps()
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  environment {
    COMPOSE_FILE = 'docker-compose.yml:docker-compose.jenkins.yml'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare') {
      steps {
        sh '''
          set -e

          echo "Checking Docker..."
          docker --version

          echo "Checking Docker Compose..."
          docker compose version

          echo "Preparation completed."
        '''
      }
    }

    stage('CI') {
      parallel {

        stage('Client CI') {
          steps {
            dir('client') {
              sh '''
                set -e

                echo "Installing client dependencies..."
                npm ci --no-audit --no-fund

                echo "Running client lint..."
                npm run lint

                echo "Building client..."
                npm run build
              '''
            }
          }
        }

        stage('Server Vet') {
          steps {
            dir('server') {
              sh '''
                set -e

                echo "Running Go vet..."
                go vet ./...
              '''
            }
          }
        }

        stage('Agent CI') {
          steps {
            dir('agent') {
              sh '''
                set -e

                echo "Running Agent vet..."
                go vet ./...

                echo "Building Agent binary..."
                CGO_ENABLED=0 go build -ldflags="-s -w" -o serverhub-agent .
              '''
            }
          }
        }
      }
    }

    stage('Build') {
      steps {
        dir('server') {
          sh '''
            set -e

            COMPOSE="$(cat "$WORKSPACE/.jenkins-compose")"

            echo "Building ServerHub Docker images..."

            $COMPOSE build
          '''
        }
      }
    }

    stage('Deploy') {
      environment {
        POSTGRES_PASSWORD = credentials('serverhub-postgres-password')
        JWT_SECRET = credentials('serverhub-jwt-secret')
        SERVERHUB_ENCRYPTION_KEY = credentials('serverhub-encryption-key')
        ADMIN_PASSWORD = credentials('serverhub-admin-password')
        GITHUB_WEBHOOK_SECRET = credentials('serverhub-webhook-secret')

        // Host port for the production PostgreSQL container.
        // Host port 5432 is already occupied.
        POSTGRES_PORT = '5434'
      }

      steps {
        dir('server') {
          sh '''
            set -e

            COMPOSE="$(cat "$WORKSPACE/.jenkins-compose")"

            echo "Stopping previous ServerHub Compose deployment..."

            $COMPOSE down --remove-orphans >/dev/null 2>&1 || true

            # ---------------------------------------------------------
            # Check host port 4000
            # ---------------------------------------------------------

            HOLDER="$(
              docker ps \
                --format '{{.Names}} {{.Image}} {{.Ports}}' \
                2>/dev/null |
              grep '4000->4000' ||
              true
            )"

            if [ -n "$HOLDER" ]; then
              echo "Port 4000 holder:"
              echo "$HOLDER"

              IMG="$(echo "$HOLDER" | awk '{print $2}')"

              if [ "$IMG" = "serverhub" ] || \
                 [ "$IMG" = "docker.io/library/serverhub" ]; then

                NAME="$(echo "$HOLDER" | awk '{print $1}')"

                echo "Detected stale ServerHub container: $NAME"
                echo "Stopping and removing it..."

                docker stop "$NAME" >/dev/null
                docker rm "$NAME" >/dev/null

              else
                echo "ERROR: Host port 4000 is held by another Docker container."
                echo "$HOLDER"

                echo ""
                echo "Stop the conflicting container or change the ServerHub host port."

                exit 1
              fi
            fi

            # ---------------------------------------------------------
            # Check host process using port 4000
            # ---------------------------------------------------------

            if command -v ss >/dev/null 2>&1; then

              HP="$(
                ss -tlnp 2>/dev/null |
                grep ':4000 ' ||
                true
              )"

              if [ -n "$HP" ]; then
                echo "ERROR: Host port 4000 is held by a host process."
                echo "$HP"

                echo ""
                echo "Stop the process/service using port 4000 and re-run Jenkins."

                exit 1
              fi
            fi

            # ---------------------------------------------------------
            # Start production deployment
            # ---------------------------------------------------------

            echo "Starting ServerHub..."

            $COMPOSE up -d

            # ---------------------------------------------------------
            # Remove dangling images
            # ---------------------------------------------------------

            echo "Cleaning unused Docker images..."

            docker image prune -f

            # ---------------------------------------------------------
            # Wait for application startup
            # ---------------------------------------------------------

            echo "Waiting for ServerHub to start..."

            sleep 8

            # ---------------------------------------------------------
            # Health check
            # ---------------------------------------------------------

            echo "Running health check..."

            HEALTH_OK=false

            if curl -s -f \
              http://localhost:4000/health \
              >/dev/null 2>&1; then

              echo "ServerHub health check passed."
              HEALTH_OK=true

            elif docker exec serverhub \
              wget -q \
              -O- \
              http://localhost:4000/health \
              >/dev/null 2>&1; then

              echo "ServerHub health check passed from inside container."
              HEALTH_OK=true

            fi

            if [ "$HEALTH_OK" != "true" ]; then
              echo "ERROR: Health check failed after deployment."

              echo ""
              echo "Container status:"
              docker ps --filter "name=serverhub"

              echo ""
              echo "Recent ServerHub logs:"
              docker logs --tail 100 serverhub || true

              exit 1
            fi
          '''
        }
      }
    }
  }

  post {

    success {
      echo 'ServerHub Jenkins pipeline completed successfully.'
    }

    failure {
      echo 'ServerHub Jenkins pipeline failed.'
    }

    unstable {
      echo 'ServerHub Jenkins pipeline completed with unstable status.'
    }
  }
}
