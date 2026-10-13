import AppKit
import WebKit
import Foundation
let path = "/Users/daedalus/Projects/tools/output/tesserae-conversation-artifact/conversation-tesserae.html"
let out = "/Users/daedalus/Projects/tools/output/tesserae-conversation-artifact/verification"
let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
class Probe: NSObject, WKNavigationDelegate {
 var web: WKWebView!
 func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
  let js = """
  (() => {const keys=['.shell','.topbar','.nav-pills','.hero','#atlas','#registry','.annotation-stack','#plates','.footer'];const box=s=>{const e=document.querySelector(s);if(!e)return null;let r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};const all=[...document.querySelectorAll('body *')].filter(e=>{let r=e.getBoundingClientRect();return r.width>0 && (r.right>innerWidth+2||r.left < -2)}).slice(0,20).map(e=>({tag:e.tagName,cls:e.className?.baseVal??e.className,rect:{x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right}}));const buttons=[...document.querySelectorAll('button')].map(e=>({text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,expanded:e.getAttribute('aria-expanded')}));return JSON.stringify({viewport:innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,boxes:Object.fromEntries(keys.map(k=>[k,box(k)])),overflow:all,buttons});})()
  """
  webView.evaluateJavaScript(js) { value,error in
   print("MOBILE_METRICS:", value ?? "nil", "ERROR:", error?.localizedDescription ?? "none")
   let test = """
   (()=>{const b=document.querySelector('[data-annotation-button="ann-1"]');b.focus();const focused=document.activeElement===b;b.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));b.click();return JSON.stringify({focused,margin:document.getElementById('ann-1').classList.contains('active'),expanded:b.getAttribute('aria-expanded'),focusVisible:matchMedia('(prefers-reduced-motion: reduce)').matches})})()
   """
   webView.evaluateJavaScript(test) { v, err in
    print("KEYBOARD_SEMANTICS:", v ?? "nil", "ERROR:",err?.localizedDescription ?? "none")
    let config=WKSnapshotConfiguration();config.rect=CGRect(x:0,y:0,width:390,height:844)
    webView.takeSnapshot(with:config) { img, err in
     if let tiff=img?.tiffRepresentation,let bitmap=NSBitmapImageRep(data:tiff),let png=bitmap.representation(using:.png,properties:[:]) {try? png.write(to:URL(fileURLWithPath:out+"/mobile-webkit.png"));print("SNAPSHOT:",png.count,"bytes")}
     else { print("SNAPSHOT_ERROR:", err?.localizedDescription ?? "none") }
     app.terminate(nil)
    }
   }
  }
 }
 func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { print("NAV_ERROR:",error);app.terminate(nil) }
}
let probe=Probe();let conf=WKWebViewConfiguration();let web=WKWebView(frame:NSRect(x:0,y:0,width:390,height:844),configuration:conf);probe.web=web;web.navigationDelegate=probe;let url=URL(fileURLWithPath:path);web.loadFileURL(url,allowingReadAccessTo:url.deletingLastPathComponent());DispatchQueue.main.asyncAfter(deadline:.now()+25){print("TIMEOUT");app.terminate(nil)};app.run()
