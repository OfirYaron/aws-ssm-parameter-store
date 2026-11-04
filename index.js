const core = require("@actions/core");
const { SSM } = require("aws-sdk");

async function run() {
  try {
    const ssm_path = core.getInput("ssm-path", { required: true });
    const ssm_value = core.getInput("ssm-value", { required: true });
    // Mask the value before anything else can print it. GitHub only auto-masks
    // values that come straight from `secrets.*`; step outputs, generated
    // passwords and other computed values are not masked unless we do it here.
    core.setSecret(ssm_value);

    core.info(`Storing Variable in path [${ssm_path}]`);
    // Load the AWS Region to use in SSM
    core.debug(`Setting aws-region [${core.getInput("aws-region")}]`);
    const ssm = new SSM({
      apiVersion: "2014-11-06",
      region: core.getInput("aws-region"),
    });
    const params = {
      Name: ssm_path,
      Value: ssm_value,
      Type: core.getInput("ssm-value-type", { required: true }),
      Overwrite: core.getBooleanInput("ssm-value-overwrite", {
        required: true,
      }),
      Description: core.getInput("ssm-value-description"),
    };
    // Never log `params` as a whole: it contains the plaintext Value.
    core.debug(
      `Prepared parameters for SSM parameter update. Name [${params.Name}] Type [${params.Type}] Overwrite [${params.Overwrite}]`
    );
    const keyId = core.getInput("ssm-kms-key-id");
    if (params["Type"] === "SecureString" && keyId !== "") {
      core.debug(`Setting the KeyId to ${keyId}`);
      params["KeyId"] = keyId;
    }
    const result = await ssm.putParameter(params).promise();
    core.debug(
      `Parameter details Version [${result.Version}] Tier [${result.Tier}]`
    );
    core.info(`Successfully Stored parameter in path [${ssm_path}]`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
