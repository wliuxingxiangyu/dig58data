/**
 * To change this template use File | Settings | File Templates.
 */
//引入数据库操作模块
var mongodb=require("./db");/*一个点为本目录*/
//声明User类
function User(user){
    this.name=user.name;
    this.password=user.password;
}
/**
 * 增加查询用户静态方法
 * @param username 用户名
 * @param callback
 */
User.find= function(username,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection("users",function(err,collection){  /*在数据库中找"users"文档（可有可无）*/
            if(err){
                mongodb.close();
                return callback(err);
            }
            //查找name属性为usename的文档
            collection.findOne({name:username},function(err,doc){  //function(err,doc)为回调函数，doc为返回的对象
                mongodb.close();
                if(doc){  /*判断查出来的数据是否存在*/ //封装文档为User对象
                    var user=new User(doc);
                    callback(err,user);
                }else{
                    callback(err,null);
                }
            })
        })
    })
}
//将User类给予接口
module.exports=User;
/**
 *使用原型增加保存方法
 * @param callback
 */
User.prototype.save=function save(callback){  /*为了注册用户*/
    //存入monggodb的文档
    var user={   /*用户有名字，密码，此处应补充邮箱，*/
        name:this.name,
        password:this.password,
        mail:this.mail
    };
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }

        //读取users集合
        db.collection("users",function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
           //为name属性增加索引
            collection.ensureIndex("name",{unique:true});
            //写入User文档
            collection.insert(user,{safe:true},function(err){
                mongodb.close();
                callback(err);
            })
        })
    })
}