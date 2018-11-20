// Compiled by ClojureScript 1.10.439 {:static-fns true, :optimize-constants true}
goog.provide('test.core');
goog.require('cljs.core');
goog.require('cljs.core.constants');
test.core.get_repos_names = (function test$core$get_repos_names(repos){
return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.cst$kw$name,repos);
});
test.core.then = (function test$core$then(p,callback){
return p.then(callback);
});
test.core.fetch = (function test$core$fetch(url){
return test.core.then(test.core.then(fetch(url),(function (p1__6111_SHARP_){
return p1__6111_SHARP_.json();
})),(function (p1__6112_SHARP_){
return cljs.core.js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(p1__6112_SHARP_,cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([cljs.core.cst$kw$keywordize_DASH_keys,true], 0));
}));
});
test.core.then(test.core.then(test.core.then(test.core.fetch("https://api.github.com/users/roman0la/repos"),test.core.get_repos_names),(function (p1__6113_SHARP_){
return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(p1__6113_SHARP_,(3));
})),cljs.core.println);
setTimeout((function (){
throw (new Error((1)));
}),(2500));
