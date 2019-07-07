//Requires
const fs = require('fs');
const testUtils = require('../extras/testUtils');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'WebServer:saveSettings';

const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Handle all the server control actions
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.scope)){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request"});
    }
    let scope = req.params.scope;

    //Delegate to the specific scope functions
    if(scope == 'global'){
        return handleGlobal(res, req);
    }else if(scope == 'fxserver'){
        return handleFXServer(res, req);
    }else if(scope == 'monitor'){
        return handleMonitor(res, req);
    }else if(scope == 'discord'){
        return handleDiscord(res, req);
    }else{
        return res.send({
            type: 'danger',
            message: 'Unknown settings scope.'
        });
    }
};


//================================================================
/**
 * Handle Global settings
 * @param {object} res 
 * @param {object} req 
 */
function handleGlobal(res, req) {
    return res.send({
        type: 'info',
        message: 'lalalalahandle Global'
    });
}


//================================================================
/**
 * Handle FXServer settings
 * @param {object} res 
 * @param {object} req 
 */
function handleFXServer(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.buildPath) ||
        isUndefined(req.body.basePath) ||
        isUndefined(req.body.cfgPath) ||
        isUndefined(req.body.onesync) ||
        isUndefined(req.body.autostart) ||
        isUndefined(req.body.quiet)
    ){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare body input
    let cfg = {
        buildPath: req.body.buildPath,
        basePath: req.body.basePath,
        cfgPath: req.body.cfgPath,
        onesync: (req.body.onesync === 'true'),
        autostart: (req.body.autostart === 'true'),
        quiet: (req.body.quiet === 'true'),
    }

    //Validating Build Path
    try {
        if(!fs.existsSync(cfg.buildPath)) throw new Error("Path doesn't exist or its unreadable.");
        if(globals.config.osType === 'Linux'){
            if(!fs.existsSync(`${cfg.buildPath}/run.sh`)) throw new Error("run.sh not found.");
        }else if(globals.config.osType === 'Windows_NT'){
            if(!fs.existsSync(`${cfg.buildPath}/run.cmd`)) throw new Error("run.cmd not found.");
            if(!fs.existsSync(`${cfg.buildPath}/fxserver.exe`)) throw new Error("fxserver.exe not found.");
        }else{
            throw new Error("OS Type not supported");
        }
    } catch (error) {
        return res.send({type: 'danger', message: `<strong>Build Path error:</strong> ${error.message}`});
    }

    //Validating Base Path
    try {
        if(!fs.existsSync(cfg.basePath)) throw new Error("Path doesn't exist or its unreadable.");
    } catch (error) {
        return res.send({type: 'danger', message: `<strong>Base Path error:</strong> ${error.message}`});
    }

    //Validating CFG Path
    try {
        let rawCfgFile = testUtils.getCFGFile(cfg.cfgPath, cfg.basePath);
        let port = testUtils.getFXServerPort(rawCfgFile);
    } catch (error) {
        return res.send({type: 'danger', message: `<strong>CFG Path error:</strong> ${error.message}`});
    }
    
    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('fxRunner');
    newConfig.buildPath = cfg.buildPath;
    newConfig.basePath = cfg.basePath;
    newConfig.cfgPath = cfg.cfgPath;
    newConfig.onesync = cfg.onesync;
    newConfig.autostart = cfg.autostart;
    newConfig.quiet = cfg.quiet;
    let saveStatus = globals.configVault.saveProfile('fxRunner', newConfig);

    //Sending output
    if(saveStatus){
        globals.fxRunner.refreshConfig();
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing fxRunner settings.`;
        logWarn(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `<strong>Configuration file saved!</strong>`});
    }else{
        logWarn(`[${req.connection.remoteAddress}][${req.session.auth.username}] Error changing fxRunner settings.`, context);
        return res.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle Monitor settings
 * @param {object} res 
 * @param {object} req 
 */
function handleMonitor(res, req) {
    return res.send({
        type: 'info',
        message: 'lalalalahandleMonitor'
    });
}


//================================================================
/**
 * Handle Discord settings
 * @param {object} res 
 * @param {object} req 
 */
function handleDiscord(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.enabled) ||
        isUndefined(req.body.token) ||
        isUndefined(req.body.statusCommand)
    ){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare body input
    let cfg = {
        enabled: (req.body.enabled === 'true'),
        token: req.body.token,
        statusCommand: req.body.statusCommand
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('discordBot');
    newConfig.enabled = cfg.enabled;
    newConfig.token = cfg.token;
    newConfig.statusCommand = cfg.statusCommand;
    let saveStatus = globals.configVault.saveProfile('discordBot', newConfig);

    //Sending output
    if(saveStatus){
        globals.discordBot.refreshConfig();
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing discordBot settings.`;
        logWarn(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `<strong>Configuration file saved!</strong>`});
    }else{
        logWarn(`[${req.connection.remoteAddress}][${req.session.auth.username}] Error changing discordBot settings.`, context);
        return res.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}
