/**
 * Created by Vadim on 12/7/15.
 */
'use strict';
var shell = require('shelljs');
var chalk = require('chalk');
var npm = require('npm');

exports.install = function (options) {
    if (!shell.which('git')) {
        return console.log(chalk.red('Prerequisite not installed: git'));
    }

    if (options.type === true) {
        return console.log(chalk.red('Wrong type'));
    }

    var folder = options.folder;
    var source = 'https://github.com/knodeit/dolphin-' + options.type + '.git';

    console.log(chalk.green('Cloning source: %s into destination folder'), source);
    source = options.branch + ' ' + source + ' ' + folder;
    shell.exec('git clone -b ' + source, function (code, output) {
        if (code) {
            return console.log(chalk.red('Error: git clone failed:', output));
        }

        shell.cd(folder);
        shell.exec('git remote rename origin upstream', function (code) {
            if (!code) {
                console.log('   git remote upstream set');
                console.log();
            }
        });

        var grunted = shell.which('grunt');
        npm.load(function (err, npm) {
            console.log(chalk.green('   installing dependencies...'));
            console.log();
            npm.commands.install(function (err) {
                if (err) {
                    console.log(chalk.red('Error: npm install failed'));
                    return console.error(err);
                }

                console.log();
                console.log('   run the app:');
                console.log('   $', grunted ? 'grunt' : 'node server');
            });
        });
    });
};