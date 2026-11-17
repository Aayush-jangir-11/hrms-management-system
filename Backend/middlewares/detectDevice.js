const UAParser = require("ua-parser-js");

const detectDevice = (req, res, next) => {
  try {
    const parser = new UAParser(req.headers["user-agent"]);
    const result = parser.getResult();

    const deviceType = result.device.type;

    let device = "";

    if (deviceType === "mobile") {
      device = `Mobile - ${result.os.name || "Unknown OS"}`;
    } else if (deviceType === "tablet") {
      device = `Tablet - ${result.os.name || "Unknown OS"}`;
    } else {
      device = `Web - ${result.os.name || "Desktop"}`;
    }

    req.device = device;

    next();
  } catch (error) {
    req.device = "Unknown Device";
    next();
  }
};

module.exports = detectDevice;
