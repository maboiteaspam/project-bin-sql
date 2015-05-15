
require('should');

var fs = require('fs');
var path = require('path');
var byline = require('byline');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var binJs = path.join(__dirname,'..','index.js');
var fixturesPath = path.join(__dirname,'fixtures');


after(function(){
  fs.unlinkSync('.local.json');
  fs.unlinkSync('machines.json');
  fs.unlinkSync('profiles.json');
  fs.unlinkSync('data.sql');
  fs.unlinkSync('schema.sql');
});

describe('project-sql', function(){

  it('should init', function(then){
    this.timeout(5000);
    var p = spawn('node', [binJs, 'init'], {stdio:['pipe','pipe','pipe']});
    var u, pw, n = false;
    p.stdout.on('data', function(d){
      process.stdout.write(d);

      (''+d).split('\n').forEach(function(l){
        if( !u && l.match(/Enter DB username/) ){
          u = true;
          p.stdin.write('root');
          p.stdin.write('\n');
        }
        if( !pw && l.match(/Enter DB password/) ){
          pw = true;
          p.stdin.write('');
          p.stdin.write('\n');
        }
        if( !n && l.match(/Enter DB name/) ){
          n = true;
          p.stdin.write('test');
          p.stdin.write('\n');
        }
        if( n && l.match(/Login success, you can proceed now !/) ){
          p.kill();
        }
      });
    });
    p.stderr.on('data', function(d){
      process.stderr.write(d);
    });
    var finish = function(err){
      p.removeListener('error', finish);
      p.removeListener('close', finish);
      if(err) console.error(err);
      (!!err).should.be.false;
      then();
    };
    p.on('error', finish);
    p.on('close', finish);

  });

  it('should not init', function(then){
    this.timeout(5000);
    var p = spawn('node', [binJs, 'init'], {stdio:['pipe','pipe','pipe']});
    var u = false;
    var pw = false;
    var n = false;
    p.stdout.on('data', function(d){
      process.stdout.write(d);

      (''+d).split('\n').forEach(function(l){
        if( !u && l.match(/Enter DB username/) ){
          u = true;
          p.stdin.write('root');
          p.stdin.write('\n');
        }
        if( !pw && l.match(/Enter DB password/) ){
          pw = true;
          p.stdin.write('');
          p.stdin.write('\n');
        }
        if( !n && l.match(/Enter DB name/) ){
          n = true;
          p.stdin.write('test');
          p.stdin.write('\n');
        }
        if( l.match(/Login success, you can proceed now !/) ){
          u.should.be.false;
          pw.should.be.false;
          n.should.be.false;
        }
      });
    });
    p.stderr.on('data', function(d){
      process.stderr.write(d);
    });
    var finish = function(err){
      p.removeListener('error', finish);
      p.removeListener('close', finish);
      if(err) console.error(err);
      (!!err).should.be.false;
      then();
    };
    p.on('error', finish);
    p.on('close', finish);

  });

  it('should export', function(then){
    this.timeout(5000);
    var p = spawn('node', [binJs, 'export'], {stdio:['pipe','pipe','pipe']});
    p.stdout.on('data', function(d){
      process.stdout.write(d);
    });
    p.stderr.on('data', function(d){
      process.stderr.write(d);
    });
    var finish = function(err){
      p.removeListener('error', finish);
      p.removeListener('close', finish);
      if(err) console.error(err);
      (!!err).should.be.false;
      then();
    };
    p.on('error', finish);
    p.on('close', finish);

  });

  it('should export schema', function(then){
    this.timeout(5000);
    var p = spawn('node', [binJs, 'export_schema'], {stdio:['pipe','pipe','pipe']});
    p.stdout.on('data', function(d){
      process.stdout.write(d);
    });
    p.stderr.on('data', function(d){
      process.stderr.write(d);
    });
    var finish = function(err){
      p.removeListener('error', finish);
      p.removeListener('close', finish);
      if(err) console.error(err);
      (!!err).should.be.false;
      then();
    };
    p.on('error', finish);
    p.on('close', finish);

  });

  it('should import', function(then){
    this.timeout(5000);
    var p = spawn('node', [binJs, 'import'], {stdio:['pipe','pipe','pipe']});
    p.stdout.on('data', function(d){
      process.stdout.write(d);
    });
    p.stderr.on('data', function(d){
      process.stderr.write(d);
    });
    var finish = function(err){
      p.removeListener('error', finish);
      p.removeListener('close', finish);
      if(err) console.error(err);
      (!!err).should.be.false;
      then();
    };
    p.on('error', finish);
    p.on('close', finish);

  });

});