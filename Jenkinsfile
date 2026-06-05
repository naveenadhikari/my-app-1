pipeline {
    agent none

    options {
        timeout(time: 30, unit: 'MINUTES')
    }

    environment {
        IMAGE_NAME     = 'my-app'
        CONTAINER_NAME = 'my-app-running'
        BRANCH_TAG     = "${env.BRANCH_NAME}".replace('/', '-')

        NOTIFY_EMAIL   = 'naveenadhikari08.17@gmail.com'       
        SLACK_CHANNEL  = '#all-my-app'

        STAGING_PORT   = '3001'
        PROD_PORT      = '3000'
    }

    stages {

        stage('Checkout') {
            agent any
            steps {
                echo "Building branch: ${env.BRANCH_NAME}"
                checkout scm
            }
        }

        stage('Install & Test') {
            agent {
                docker {
                    image 'node:18-alpine'
                    args '-u root'
                }
            }
            options {
                timeout(time: 10, unit: 'MINUTES')
                retry(2)
            }
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            agent any
            options {
                timeout(time: 10, unit: 'MINUTES')
            }
            steps {
                sh "docker build -t ${IMAGE_NAME}:${BRANCH_TAG} ."
            }
        }

        stage('Deploy to Staging') {
            when {
                not { branch 'main' }
            }
            agent any
            steps {
                echo "Deploying ${env.BRANCH_NAME} to staging..."
                sh """
                    docker stop ${IMAGE_NAME}-staging || true
                    docker rm   ${IMAGE_NAME}-staging || true
                    docker run -d \
                        --name ${IMAGE_NAME}-staging \
                        -p ${STAGING_PORT}:3000 \
                        -e BRANCH_NAME=${BRANCH_TAG} \
                        ${IMAGE_NAME}:${BRANCH_TAG}
                """

                // Wait for container to boot then health check
                retry(5) {
                    sleep(time: 10, unit: 'SECONDS')
                    sh "curl -f http://172.17.0.1:${STAGING_PORT}/health"
                }

                echo "Staging live and healthy at http://localhost:${STAGING_PORT}"
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            agent any
            steps {
                echo "Deploying to production..."
                sh """
                    docker stop ${CONTAINER_NAME} || true
                    docker rm   ${CONTAINER_NAME} || true
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p ${PROD_PORT}:3000 \
                        -e BRANCH_NAME=main \
                        ${IMAGE_NAME}:${BRANCH_TAG}
                """

                retry(5) {
                    sleep(time: 10, unit: 'SECONDS')
                    sh "curl -f http://localhost:${PROD_PORT}/health"
                }

                echo "Production live and healthy at http://localhost:${PROD_PORT}"
            }
        }
    }

   post {
    success {
        mail(
            to:      "${NOTIFY_EMAIL}",
            subject: "✅ PASSED — ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            body:    """
                Build passed!
                Job:    ${env.JOB_NAME}
                Branch: ${env.BRANCH_NAME}
                Build:  #${env.BUILD_NUMBER}
                URL:    ${env.BUILD_URL}
            """
        )
        withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_URL')]) {
            sh """
                curl -X POST \$SLACK_URL \
                -H 'Content-type: application/json' \
                --data '{"text":"✅ *PASSED* | *${env.JOB_NAME}* | Branch: ${env.BRANCH_NAME} | Build #${env.BUILD_NUMBER}"}'
            """
        }
    }

    failure {
        mail(
            to:      "${NOTIFY_EMAIL}",
            subject: "❌ FAILED — ${env.JOB_NAME} #${env.BUILD_NUMBER}",
            body:    """
                Build FAILED — please investigate.
                Job:    ${env.JOB_NAME}
                Branch: ${env.BRANCH_NAME}
                Build:  #${env.BUILD_NUMBER}
                URL:    ${env.BUILD_URL}
            """
        )
        withCredentials([string(credentialsId: 'slack-webhook', variable: 'SLACK_URL')]) {
            sh """
                curl -X POST \$SLACK_URL \
                -H 'Content-type: application/json' \
                --data '{"text":"❌ *FAILED* | *${env.JOB_NAME}* | Branch: ${env.BRANCH_NAME} | Build #${env.BUILD_NUMBER}"}'
            """
        }
    }

    always {
        echo "Pipeline finished — Branch: ${env.BRANCH_NAME} | Build: #${env.BUILD_NUMBER}"
    }
}

}