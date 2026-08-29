const {
    SecretsManagerClient,
    GetSecretValueCommand
} = require("@aws-sdk/client-secrets-manager");

const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "eu-north-1"
});

async function getDatabaseSecret() {
    const command = new GetSecretValueCommand({
        SecretId: process.env.DB_SECRET_ARN
    });

    const response = await client.send(command);

    return JSON.parse(response.SecretString);
}

module.exports = getDatabaseSecret;
