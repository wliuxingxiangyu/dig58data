/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  ,engine=require('./expand_modules/ejs')  //引入对象engine
  , util=require('util')
  , path = require('path')
  , connect=require("connect")
  , MongoStore = require('connect-mongo')(connect)
  ,  fs=require('fs')
  , flash = require('connect-flash')
  , settings = require('./settings');



var app = express();

//改造ejs引擎中的方法
app.engine('ejs', engine);  //注册引擎为ejs模板
app.engine('html', require('ejs').renderFile);
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views',__dirname+'/views');//指定页面模版的存放目录
  app.set('view engine', 'ejs'); //使用ejs模版引擎
  app.use(flash());
  app.set("view options", {
  layout: true
  });
  
  //设置默认模版路径
  app.locals._layoutFile='layout'
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //使用cookie中间件
  app.use(express.cookieParser());

  //会话中间件，存放在mongodb中
    app.use(express.session({
        secret:settings.cookieSecret,
        store:new MongoStore({
            db:settings.db
        })
    }));

    //使用中间件来返回成功和失败的信息
    app.use(function(req, res, next){   //交给下层
        //声明变量
        var err = req.session.error
            , msg = req.session.success;
        //删除会话中原有属性
        delete req.session.error;
        delete req.session.success;
        //将错误和正确信息存放到动态试图助手变量中。
        res.locals.message = '';
        if (err) res.locals.message = '<div class="alert alert-error">' + err + '</div>';
        if (msg) res.locals.message = '<div class="alert alert-success">' + msg + '</div>';
        next();
    });

    //使用中间件把user设置成动态视图助手
    app.use(function(req, res, next){
        res.locals({
            user:req.session.user
        })
        next();
    })
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

/*路由规划*/
app.get('/', routes.index);  //，用户如果访问'/'路径，则routes.index来控制
app.get("/u/:user",routes.user); //用户的主页
app.post('/post',routes.post);   //发表信息
app.get('/reg',routes.reg); //用户注册
app.post('/reg',routes.doReg);
app.get('/login',routes.login);//用户登录
app.post('/login',routes.doLogin);   

app.get('/search',routes.search); //用户查询    
app.post('/search',routes.search); //用户查询        
app.get('/logout',routes.logout);//用户退出
app.get('/loveAnimation/layout.html',routes.loveAnimation);//浪漫
app.get('/bj58',routes.bj58);   
app.get('/housePrice',routes.housePrice); 
app.get('/livePigPriceTrend',routes.livePigPriceTrend); 
app.get('/other',routes.other);

//文件上传
//<span style="white-space:pre"></span>
//app.get('/upload',checkLogin);  
app.get('/upload',function(req,res){  
    res.render('upload',{  
        title:'文件上传',  
        user:req.session.user,  
        success:req.flash('success').toString(),  
        error:req.flash('error').toString()  
    });  
});  
  
//app.post('/upload',checkLogin);  
app.post('/upload',function(req,res){  
    for(var i in req.files){  
        if(req.files[i].size==0){  
            //使用同步方式删除一个文件  
        	try{ fs.unlinkSync(req.files[i].path);  //删除文件  
            console.log("successfully removed an empty file");
        	}catch(e){console.log(e);}
        }else{  
            var target_path='../dig58data/public/upLoadFiles/'+req.files[i].name;  
            try{ 
                var readStream = fs.createReadStream(req.files[i].path); //源文件
                var writeStream = fs.createWriteStream(target_path);//目标文件夹
                readStream.pipe(writeStream);
                
                readStream.on('end',function() {
                    fs.unlinkSync(req.files[i].path);  //删除源文件缓存
                    console.log('successfully rename a file');
                });
            }catch(e){console.log(e);}
        }  
    }  
    req.session.success="上传文件成功";
    var currentUser=req.session.user;
    res.redirect("/u/"+currentUser.name); 
});  

//保留上传文件的后缀名，并把上传目录设置为 /public/images/upLoadPicture   
app.use(express.bodyParser({ keepExtensions: true, uploadDir: './dig58data/public/images/upLoadPicture' }));

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
