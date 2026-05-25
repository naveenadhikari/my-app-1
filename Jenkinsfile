pipeline {
    agent none

    environment {
        IMAGE_NAME = 'my-app'
        CONTAINER_NAME = 'my-app-running'
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
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            agent any
            steps {
                sh "docker build -t ${IMAGE_NAME}:${env.BRANCH_NAME} ."
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
                    docker rm ${IMAGE_NAME}-staging || true
                    docker run -d \
                        --name ${IMAGE_NAME}-staging \
                        -p 3001:3000 \
                        ${IMAGE_NAME}:${env.BRANCH_NAME}
                """
                echo "Staging live at http://localhost:3001"
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
                    docker rm ${CONTAINER_NAME} || true
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p 3000:3000 \
                        ${IMAGE_NAME}:${env.BRANCH_NAME}
                """
                echo "Production live at http://localhost:3000"
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded for branch: ${env.BRANCH_NAME}"
        }
        failure {
            echo "Pipeline failed for branch: ${env.BRANCH_NAME}"
        }
    }
}