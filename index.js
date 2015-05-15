#!/usr/bin/env node

var pkg = require("./package.json");
var Cluc = require("cluc");
var program = require("commander");
var Config = require("project-bin-config");
var inquirer = require("inquirer");

program
  .version(pkg.version)

  .command('import [env] [file]')
  .description('Import a SQL file to the database')
  .action(function (env, file) {

    env = !env?'local':env;
    file = !file?'data.sql':file;

    (new Config()).load().get(env)
      .forEach(function(machine){
        if(!machine.mysql || !machine.mysql.user){
          console.error(machine)
          console.error('skipped '+machine.machineId);
        }else{

          var mysql = machine.mysql;
          var command = '';
          command += (machine.profileData.mysql_bin_path||'mysql')+' ';

          command += ' -u '+mysql.user;

          if(mysql.password){
            command += ' -p '+mysql.password;
          }
          if(mysql.host){
            command += ' --host '+mysql.host;
          }
          if(mysql.import_options){
            command += ' '+mysql.import_options+' ';
          }
          if(mysql.database){
            command += ' '+mysql.database+' ';
          }
          command += ' < '+(file || mysql.default_file || 'data.sql');

          new Cluc().stream(command, function(){
            this.display();
          }).run(new Cluc.transports.process(), function(){});
        }
      });
  });

program
  .command('export [env] [file]')
  .description('Export a database to a SQL file')
  .action(function (env, file) {

    env = !env?'local':env;
    file = !file?'data.sql':file;

    (new Config()).load().get(env)
      .forEach(function(machine){
        var mysql = machine.mysql || {};
        listTables(env, function(allTables){
          var ignoreTables = removeIgnoredTables(allTables, mysql.export_ignores || []);
          ignoreTables.forEach(function(t,i){
            ignoreTables[i] = ' --ignore-table='+mysql.database+'.'+t;
          });

          var command = '';
          command += (machine.profileData.mysqldump_bin_path||'mysqldump')+' ';
          command += ' -u'+mysql.user;
          if(mysql.password){
            command += ' -p '+mysql.password;
          }
          if(mysql.host){
            command += ' --host '+mysql.host;
          }
          if(mysql.export_options){
            command += ' '+mysql.export_options;
          }
          command += ' '+ignoreTables.join(' ');
          if(mysql.database){
            command += ' '+mysql.database;
          }
          command += ' > '+(file || mysql.default_file);

          new Cluc().stream(command, function(){
            this.spin(/.*/);
          }).run(new Cluc.transports.process(), function(){});
        });
      });
  });

program
  .command('export_schema [env] [file]')
  .description('Export database schema to a SQL file')
  .action(function (env, file) {

    env = !env?'local':env;
    file = !file?'schema.sql':file;

    (new Config()).load().get(env)
      .forEach(function(machine){
        var mysql = machine.mysql || {};
        listTables(env, function(allTables){
          var ignoreTables = removeIgnoredTables(allTables, mysql.export_ignores || []);
          ignoreTables.forEach(function(t,i){
            ignoreTables[i] = ' --ignore-table='+mysql.database+'.'+t;
          });

          var command = '';
          command += (machine.profileData.mysqldump_bin_path||'mysqldump')+' ';
          command += ' -u'+mysql.user;
          if(mysql.password){
            command += ' -p '+mysql.password;
          }
          if(mysql.host){
            command += ' --host '+mysql.host;
          }
          if(mysql.export_options){
            command += ' '+mysql.export_options+' ';
          }
          command += ' --no-data ';
          command += ' '+ignoreTables.join(' ')+' ';
          if(mysql.database){
            command += ' '+mysql.database+' ';
          }
          command += ' > '+(file || mysql.default_schema_file);
          (new Cluc()).stream(command, function(err){
            if(err) console.error(err);
            this.spin(/.*/);
          }).run(new (Cluc.transports.process)());
        });
      });
  });

program
  .command('init').description('Initialize your local setup')
  .action(function(){

    var checkKnownBin = function(then){
      var knownBins = [
        'mysql',
        'C:\\wamp\\bin\\mysql\\mysql5.6.17\\bin\\mysql.exe',
        'D:\\wamp\\bin\\mysql\\mysql5.6.17\\bin\\mysql.exe'
      ];
      var found = false;
      var clucLine = (new Cluc());
      knownBins.forEach(function(knownBin){
        var command = knownBin+ ' --version ';
        clucLine.stream(command, function(){
          this.capture(/\s+(Ver.+)/i, null, function(){
            if(this.matched){
              found = knownBin;
            }
          });
        });
      });
      clucLine.run(new Cluc.transports.process(), function(){
        then(found);
      });
    };
    var askForBin = function(then){
      inquirer.prompt([{
        type: "input",
        name: "bin",
        message: "Enter path to mysql binary"
      }], function( answers ) {
        var found = false;
        (new Cluc()).stream(answers.bin+ ' --version ', function(){
          this.capture(/\s+(Ver.+)/i, null, function(matched){
            if(matched) found = matched;
          })
        }).run(new (Cluc.transports.process)(), function(){
          if(!found){
            askForBin(then);
          }else{
            then(found);
          }
        });
      });
    };
    var checkOrAskForBin = function(then){
      var local = (new Config()).load().get("local")[0];
      if(!local.profileData || !local.profileData.mysql_bin_path){
        checkKnownBin(function(found){
          if(found){
            return then(found);
          }
          askForBin(function(correct){
            return then(correct);
          })
        });
      }else{
        then(true);
      }
    };

    var testCredentials = function(user, pwd, database, then){
      var local = (new Config()).load().get("local")[0];
      var cmd = local.profileData.mysql_bin_path+ ' -u '+user;
      if(pwd){
        cmd += ' -p '+pwd;
      }
      if(database){
        cmd += ' '+database;
      }
      cmd += ' -e "SHOW DATABASES;" ';
      var found = false;
      (new Cluc()).stream(cmd, function(){
        this.capture(/information_schema/i, null, function(){
          if(this.matched){
            found = true;
          }
        });
      }).run(new (Cluc.transports.process)(), function(){
        then(found);
      });
    };
    var askForCredentials = function(then){
      inquirer.prompt([{
        type: "input",
        name: "user",
        default:"root",
        message: "Enter DB username"
      },{
        type: "input",
        name: "pwd",
        default:"",
        message: "Enter DB password"
      },{
        type: "input",
        name: "database",
        default:"",
        message: "Enter DB name"
      }], function( answers ) {
        testCredentials(answers.user, answers.pwd, answers.database, function(found){
          if(found){
            then(answers.user, answers.pwd, answers.database);
          }else{
            askForCredentials(then);
          }
        })
      });
    };
    var checkOrAskForCredentials = function(then){
      var local = (new Config()).load().get("local")[0];
      if(!local.mysql){
        askForCredentials(then);
      }else{
        then(local.mysql.user, local.mysql.pwd, local.mysql.database);
      }
    };

    checkOrAskForBin(function(found){
      if(found!==true){
        (new Config()).load().setProfile("local", {
          mysql_bin_path:found,
          mysqldump_bin_path:found.replace(/(mysql)(\.exe)?$/, 'mysqldump$2')
        }).write();
      }
      checkOrAskForCredentials(function(user, pwd, database){
        (new Config()).load().setEnv("local", {
          mysql:{
            user:user,
            pwd:pwd,
            database:database,
            host:"localhost"
          }
        }).write();
        console.log("");
        console.log("Login success, you can proceed now !");
      });
    });

  });

program
  .command('*').description('help')
  .action(function(){
    program.outputHelp();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

function listTables(env, then){
  var tables = [];
  (new Config()).load().get(env)
    .forEach(function(machine){
      var mysql = machine.mysql || {};
      var command = '';
      command += machine.profileData.mysql_bin_path||'mysql';
      command += ' -u '+mysql.user;
      if(mysql.password){
        command += ' -p '+mysql.password;
      }
      if(mysql.host){
        command += ' --host '+mysql.host;
      }
      if(mysql.database){
        command += ' '+mysql.database+' ';
      }
      command += ' -e "SHOW TABLES;"';
      var transport = new (Cluc.transports.process)();
      (new Cluc()).stream(command, function(){
        this.capture(/^\s*([a-z0-9-_]+)\s*$/i, null, function(){
          if(this.matched && !this.matched[0].match(/Tables_in_/)){
            tables.push(this.matched[0]);
          }
        });
        this.spin(/.*/);
      }).run(transport, function(){
        then(tables)
      });
    });
}

function removeIgnoredTables(tables, ignores){
  var ignoredTables = [];
  tables.forEach(function(table){
    ignores.forEach(function(p){
      if(table.match(new RegExp(p))){
        ignoredTables.push(table);
      }
    });
  });
  return ignoredTables;
}
