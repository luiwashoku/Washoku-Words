// Run from the project root: swift -module-cache-path /private/tmp/miso-swift-cache scripts/extract-miso-pdf.swift "nopush/🔵基本　味噌-1.pdf"
// Crops use the 1095 × 1550 inspection coordinate system; render at 2× for legible enlargement.
import Foundation
import PDFKit
import AppKit
let doc=PDFDocument(url:URL(fileURLWithPath:CommandLine.arguments[1]))!
var sourcePages: [String] = []
for i in 0..<doc.pageCount { sourcePages.append(doc.page(at:i)!.string ?? "") }
try sourcePages.joined(separator:"\u{000c}\n").write(toFile:"data/fermentation-notes/miso-source.txt", atomically:true, encoding:.utf8)
let crops:[(Int,String,Double,Double,Double,Double)] = [
(1,"miso-map",155,315,850,640),
(2,"miso-process",130,155,840,155),(2,"miso-salt-formula",210,1035,530,80),
(3,"miso-soak",574,421,178,133),(3,"miso-boil",660,637,165,124),(3,"miso-softness",660,771,165,123),(3,"miso-mash",176,907,669,150),(3,"miso-bag",190,1203,170,148),(3,"miso-loosen-koji",434,1203,410,148),
(4,"miso-combine",190,280,620,140),(4,"miso-mix",175,531,610,135),(4,"miso-balls",194,744,624,145),(4,"miso-pack",192,1003,631,146),(4,"miso-close",216,1276,614,125),
(5,"miso-seal",215,242,700,150),(5,"miso-aged",340,529,395,233),(5,"miso-tyrosine",92,857,288,230),(5,"miso-mould",128,1259,726,210)]
try FileManager.default.createDirectory(atPath:"assets/fermentation-notes/miso",withIntermediateDirectories:true)
for (n,name,x,y,w,h) in crops {
 let thumbnail=doc.page(at:n-1)!.thumbnail(of:NSSize(width:2200,height:3100),for:.mediaBox)
 let rep=NSBitmapImageRep(data:thumbnail.tiffRepresentation!)!
 let cg=rep.cgImage!
 let scale=Double(cg.width)/1095.0
 let region=CGRect(x:x*scale,y:y*scale,width:w*scale,height:h*scale)
 let crop=cg.cropping(to:region)!
 let out=NSBitmapImageRep(cgImage:crop)
 let isDiagram = ["miso-process", "miso-salt-formula"].contains(name)
 let ext = isDiagram ? "png" : "jpg"
 try out.representation(using:isDiagram ? .png : .jpeg,properties:[.compressionFactor:0.88])!.write(to:URL(fileURLWithPath:"assets/fermentation-notes/miso/\(name).\(ext)"))
 print("\(name) \(crop.width) \(crop.height)")
}
