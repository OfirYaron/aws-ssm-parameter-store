# AWS SSM Parameter Store GitHub Action

This GitHub Action allows you to inject parameters into AWS Systems Manager Parameter Store. It was created to solve the problem of secret management when using infrastructure as code.

Terraform requires extra work in order to secure your state file because the secret is stored as plain text. This would require you to encrypt/decrypt the statefile when you are modifying state.

CloudFormation requires you to store it before you can reference it.

This action helps solve this problem by allowing the user to provide the path and the value that wants to be stored in a GitHub Action and the value can be passed in as a secret from the github actions. Pair this with the `Environments` feature and you can have a GitHub Action CI that also manages secrets.

## Inputs

### `aws-region`

**Required** The AWS Region to use.

### `ssm-path`

**Required** The SSM Parameter Store path (parameter name) to write to.

### `ssm-value`

**Required** The value to be stored in the SSM Parameter Store Path.

### `ssm-value-description`

**Optional** A description of the value being inserted into SSM.

### `ssm-value-type`

**Optional** The value type to store the SSM Parameter (String | StringList | SecureString). Default `SecureString`.

### `ssm-value-overwrite`

**Optional** To overwrite the value of the SSM Parameter when inserting. Default `true`.

### `ssm-kms-key-id`

**Optional** The AWS KMS Key ARN to use to encrypt the key. Default uses the AWS Provided KMS Key ID .

## Logging and masking

The action calls [`core.setSecret`](https://github.com/actions/toolkit/tree/main/packages/core#setting-a-secret) on `ssm-value` as soon as it reads it, so the value is masked in the job log even when it is not a `secrets.*` reference (for example a step output or a generated password). The value is never written to the log: with step debug logging on (`ACTIONS_STEP_DEBUG`), only non-secret metadata is logged: the `aws-region`, the parameter `Name`, `Type` and `Overwrite` flag, the KMS key ID when one is set for a `SecureString`, and the `Version` and `Tier` returned by SSM.

## Runtime

The action runs on the `node24` runtime (`runs.using: node24`). GitHub runners default to Node 24 from June 16, 2026, and Node 20 was scheduled for removal on September 23, 2026 ([changelog](https://github.blog/changelog/2026-09-23-deprecation-of-node-20-on-github-actions-runners/)); Node 16 was retired before that. Self-hosted runners and GHES need runner v2.328.0 or newer. Node 24 has no ARM32 build and does not run on macOS 13.4 or older.

The action runs the bundled `dist/index.js`. After changing `index.js` or the dependencies, rebuild it with `npm ci && npm run package` and commit `dist/`. The `Check dist/` workflow fails if the committed bundle is out of date.

## Example usage

```yaml
name: store_secret
on:
  pull_request:
    branches:
      - master
jobs:
  add_to_ssm:
    runs-on: ubuntu-latest
    name: Store a Secret
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1
      - name: Add hello SecureString to SSM
        uses: dwardu89/aws-ssm-parameter-store@latest
        with:
          ssm-path: "/dwardu89/hello"
          ssm-value: ${{ secrets.WORLD }}
          aws-region: eu-west-1
          ssm-value-type: "String"
```

## Required IAM Permissions

In order to use this, your AWS User/Role must allow the `ssm:PutParameter` action.

e.g.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PutSSMParameters",
      "Effect": "Allow",
      "Action": "ssm:PutParameter",
      "Resource": ["arn:aws:ssm:eu-west-1:1234567890:parameter/dwardu89/hello"]
    }
  ]
}
```

## Local Testing

To test this action locally, you can use [`act`](https://github.com/nektos/act)

1. Install `act`
2. Make your AWS credentials accessible as variables on your command line. `export AWS_ACCESS_KEY_ID="wasd"`
3. Run the command below.

```
act -j local_test_store_ssm --secret AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID --secret AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY --secret SSM_PATH="/joshghent/helloworld" --secret SSM_VALUE="hello"
```

## Credit

Original code by [@dwardu89](https://github.com/dwardu89)
