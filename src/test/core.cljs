(ns test.core)

(defn get-repos-names [repos]
  (map :name repos))

(defn then [p callback]
  (.then p callback))

(defn fetch [url]
  (-> (js/fetch url)
      (then #(.json %))
      (then #(js->clj % :keywordize-keys true))))

(-> (fetch "https://api.github.com/users/roman0la/repos")
    (then get-repos-names)
    (then #(nth % 3))
    (then println))

(js/setTimeout
 #(throw (js/Error. "hello"))
 2500)


;; hello