(ns test.preload
  (:require [figwheel.tools.heads-up :as fw]
            [clojure.string :as cstr]
            [cljs.pprint :as pp]))

(defn display-error [message]
  (fw/display-heads-up
   {:backgroundColor "rgba(255, 161, 161, 0.95)"}
   message))

(defn ->messages [message lines last-message error-inline]
  (concat
   (map
    #(str "<div>" % "</div>")
    [(when message
       (str "<span style=\"font-weight:bold;\">" (fw/escape message) "</span>"))
     (when (pos? (count error-inline))
       (fw/format-inline-error error-inline))])
   (when last-message
     [(str "<div style=\"color: #AD4F4F; padding-top: 3px; margin-bottom: 10px;\">" (fw/escape last-message) "</div>")])))

(defn format-stack-frame [message {:keys [column line source name]}]
  (let [n (Math/floor (/ (count name) 2))
        bl (subvec name 0 n)
        al (subvec name (inc n) (count name))
        last-msg (cond
                   (and source line) (str "Please see line " line " of file " source)
                   source (str "Please see " source)
                   :else nil)
        error-inline (->> (concat bl [(nth name n) (str (cstr/join "" (repeat column " ")) "^--- " message)] al)
                          (map-indexed #(vector (cond
                                                  (= n %1) :error-in-code
                                                  (= (dec %1) n) :error-message
                                                  :else :code-line)
                                                (cond (= (dec %1) n) nil
                                                      (> %1 n) (dec (+ %1 (- line n)))
                                                      :else (+ %1 (- line n)))
                                                %2)))]
    (str (fw/close-link)
         (fw/heading "Runtime Exception" source)
         (fw/file-selector-div source line column (apply str (->messages message name last-msg error-inline))))))

(defn format-error [{message :message stack :__stack}]
  (format-stack-frame message (last stack)))

(defn map-stack-trace [error]
  (js/mapStackTrace #js {:message (.-message error)
                         :stack (.-stack  error)
                         :linesInFrame 10 ;; only odd? numbers, so target line can be always in the middle
                         :maxLines 1
                         :excludes #js [] ;; #js [".*\/cljs\/core.cljs$"]
                         :mode "expanded"})) ;; "simple" | "expanded"

(defn on-unhandledrejection [event]
  (let [error (.-reason event)]
    (when (instance? js/Error error)
      (map-stack-trace error)
      (.preventDefault event))))

(defn on-error [event]
  (let [error (.-error event)]
    (when (instance? js/Error error)
      (map-stack-trace error)
      ;; do not display default printing
      (.preventDefault event))))

(js/addEventListener "unhandledrejection" on-unhandledrejection) ;; catch Promise errors
(js/addEventListener "error" on-error) ;; catch all other errors

(js/onMappedError #(do (-> % (js->clj :keywordize-keys true) format-error display-error)
                       (js/console.error %)))