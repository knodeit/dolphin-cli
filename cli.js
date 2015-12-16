/**
 * Created by Vadim on 12/7/15.
 */
'use strict';
var shell = require('shelljs');
var chalk = require('chalk');
var npm = require('npm');
var async = require('async');
var PathUtil = require('path');
var fs = require('fs');
var bower = require('bower');
var ModuleUtil = require('dolphin-core-utils').Module;

exports.init = function (folder, options) {
    if (!shell.which('git')) {
        return console.log(chalk.red('Prerequisite not installed: git'));
    }

    if (options.type === true) {
        return console.log(chalk.red('Wrong type, only "develop" or "cms"'));
    }

    var source = 'https://github.com/knodeit/dolphin-' + options.type + '.git';

    console.log(chalk.green('Cloning source: %s into destination folder'), source);
    source = options.branch + ' ' + source + ' ' + folder;
    shell.exec('git clone -b ' + source, function (code, output) {
        if (code) {
            return console.log(chalk.red('Error: git clone failed:', output));
        }

        shell.cd(folder);
        shell.exec('rm -rf ./.git*', function (code) {
            if (!code) {
                console.log('   git remote upstream set');
                console.log();
            }
        });

        var gulped = shell.which('gulp');
        console.log('   install dependencies:');
        console.log('     $ cd %s && npm install', folder);
        console.log();
        console.log('   run the app:');
        console.log('     $', gulped ? 'gulp' : 'node server');
        console.log();
    });
};

exports.postinstall = function () {

    function installPackage(source, callback) {
        console.log(chalk.green(source));
        console.log(chalk.green('Installing npm...'));

        npm.load({
            loglevel: 'error'
        }, function (err, npm) {
            npm.commands.install(source, [], function (err) {
                if (err) {
                    console.log(chalk.red('Error: npm install failed..'));
                    console.error(err);
                    return callback(err);
                }

                if (!fs.existsSync(PathUtil.join(source, 'bower.json'))) {
                    return callback();
                }
                console.log(chalk.green('Installing bower...'));

                var count = source.replace(process.cwd(), '').split('/').length;
                var prefix = './';
                if (count > 0) {
                    for (var i = 1; i < count; i++) {
                        prefix = prefix + '../';
                    }
                }
                bower.commands.install(undefined, undefined, {cwd: source, directory: prefix + 'bower_components', interactive: true}).on('error', function (err) {
                    if (err) {
                        console.log(chalk.red(source));
                        console.log(chalk.red(err));
                    }
                    callback();
                }).on('end', function () {
                    console.log(' ');
                    callback();
                });
            });
        });
    }

    console.log(chalk.green('Installing Bower dependencies in root folder'));
    bower.commands.install().on('error', function (err) {
        console.log(chalk.red(err));
        runLocalPackages();
    }).on('end', runLocalPackages);

    function runLocalPackages() {
        console.log(chalk.green('Installing other packages'));
        console.log(' ');

        ModuleUtil.findLocalModules().then(function (files) {
            var queue = async.queue(installPackage, 1);

            for (var i in files) {
                queue.push(files[i].source);
            }
        });
    }

};