/*
 * GET home page.
 */
var express = require('express');
var crypto = require('crypto'),
	User = require('../models/user.js');
Post = require('../models/post.js');



module.exports = function(app) {
	// app.get('/', function(req, res) {
	// 	res.render('index', {
	// 		title: '主页',
	// 		user: req.session.user,
	// 		success: req.flash('success').toString(),
	// 		error: req.flash('error').toString()
	// 	});
	// });


	app.get('/', function(req, res) {
		Post.getAll(null, function(err, posts) {
			if (err) {
				posts = [];
			}
			res.render('index', {
				title: '主页',
				user: req.session.user,
				posts: posts,
				success: req.flash('success').toString(),
				error: req.flash('error').toString()


			});
		});
	});



	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res) {
		res.render('reg', {
			title: '注册',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.get('/reg', checkNotLogin);
	app.post('/reg', function(req, res) {
		//检验用户两次输入的口令是否一致
		if (req.body['password-repeat'] != req.body['password']) {
			req.flash('error', '两次输入的口令不一致');
			return res.redirect('/reg');
		}
		//生成口令的散列值
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.username,
			password: password,
		});
		//检查用户名是否已经存在
		User.get(newUser.name, function(err, user) {
			if (user)
				err = 'Username already exists.';
			if (err) {
				req.flash('error', err);
				return res.redirect('/reg');
			}
			//如果不存在则新增用户
			newUser.save(function(err) {
				if (err) {
					req.flash('error', err);
					return res.redirect('/reg');
				}
				// req.session.user = newUser;
				req.flash('success', '注册成功');
				res.redirect('/');
			});
		});
	});
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res) {
		res.render('login', {
			title: '登录',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/post', checkLogin);
	app.get('/post', function(req, res) {
		res.render('post', {
			title: '发表',
			user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});

	app.get('/login', checkNotLogin);
	app.post('/login', function(req, res) {
		//生成密码的散列值
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.username,
			password: password,
		});
		//检查用户是否存在
		User.get(req.body.username, function(err, user) {
			if (!user) {
				req.flash('error', '用户不存在!');
				return res.redirect('/login');
			}
			console.log(user.password);
			console.log(password);
			//检查密码是否一致
			if (user.password != password) {
				req.flash('error', '密码错误!');
				return res.redirect('/login');
			}
			//用户名密码都匹配后，将用户信息存入 session
			req.session.user = user;
			req.flash('success', '登陆成功!');
			res.redirect('/');
		});
	});

	app.get('/logout', function(req, res) {
		if (req.session.user) {
			req.session.user = null;
			req.flash('success', '登出成功!');
			return res.redirect('/');
		}
		req.flash('error', '当前没有用户')
		res.redirect('/');
	});


app.get('/u/:name', function(req,res){
  //检查用户是否存在
  User.get(req.params.name, function(err, user){
    if(!user){
      req.flash('error','用户不存在!'); 
      return res.redirect('/');
    }
    //查询并返回该用户的所有文章
    Post.getAll(user.name, function(err, posts){
      if(err){
        req.flash('error',err); 
        return res.redirect('/');
      } 
      res.render('user',{
        title: user.name,
        posts: posts,
        user : req.session.user,
        success : req.flash('success').toString(),
        error : req.flash('error').toString()
      });
    });
  }); 
});

app.get('/u/:name/:day/:title', function(req,res){
  Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
    if(err){
      req.flash('error',err); 
      return res.redirect('/');
    }
    res.render('article',{
      title: req.params.title,
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
	app.post('/post', checkLogin);
	app.post('/post', function(req, res) {
		var currentUser = req.session.user,
			post = new Post(currentUser.name, req.body.title, req.body.post);
		post.save(function(err) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功!');
			res.redirect('/');
		});
	});

	function checkLogin(req, res, next) {
		if (!req.session.user) {
			req.flash('error', '未登录!');
			return res.redirect('/login');
		}
		next();
	}

	function checkNotLogin(req, res, next) {
		if (req.session.user) {
			req.flash('error', '已登录!');
			return res.redirect('/');
		}
		next();
	}

};