import { ObjectId } from "mongodb";
import { connectDB } from "../config/db";
import { getAuth } from "../auth";
import { usersCollection } from "../models/user";
import { shopsCollection } from "../models/shop";
import { productsCollection } from "../models/product";

const DEMO_PASSWORD = "Demo1234!";

const CATEGORY_IMAGES: Record<string, string> = {
  "power-tools": "https://i.ibb.co/ymR4WTy8/1e703bc97acc.jpg",
  "hand-tools": "https://i.ibb.co/S4MZ977J/3c8a111bae24.jpg",
  grinding: "https://i.ibb.co/twVnbYmt/2efdc93e4243.jpg",
  drilling: "https://i.ibb.co/FbSSxKLD/07f71597a18e.jpg",
  cutting: "https://i.ibb.co/ycWqm6m3/bd87381873af.jpg",
  measuring: "https://i.ibb.co/ZRR5zcSF/b1395fb12c75.jpg",
  fasteners: "https://i.ibb.co/YTwkVdFQ/21fe03d4e8cd.jpg",
  "safety-gear": "https://i.ibb.co/zWLcTss9/87434bba351c.jpg",
  welding: "https://i.ibb.co/0px1fP1V/7285e36b397e.jpg",
  generators: "https://i.ibb.co/dwcrqWz9/ed90a9ac8ad5.jpg",
};

const NEW_SELLERS = [
  {
    email: "seller2@demo.toolbazaar.dev",
    name: "Chattogram Machine Traders",
    shopName: "Chattogram Machine Traders",
    description: "Heavy machinery and industrial-grade power tools from Chattogram's oldest tool market.",
    address: "Agrabad, Chattogram, Bangladesh",
  },
  {
    email: "seller3@demo.toolbazaar.dev",
    name: "Precision Tools BD",
    shopName: "Precision Tools BD",
    description: "Precision measuring instruments and fine hand tools for professionals and hobbyists.",
    address: "Motijheel, Dhaka, Bangladesh",
  },
  {
    email: "seller4@demo.toolbazaar.dev",
    name: "IronWorks Supply Co.",
    shopName: "IronWorks Supply Co.",
    description: "Welding equipment, safety gear, and fasteners for workshops and construction sites.",
    address: "Tongi, Gazipur, Bangladesh",
  },
  {
    email: "seller5@demo.toolbazaar.dev",
    name: "Sylhet Hardware House",
    shopName: "Sylhet Hardware House",
    description: "Full-range hardware store supplying generators, cutting tools, and general fasteners.",
    address: "Zindabazar, Sylhet, Bangladesh",
  },
];

const EXISTING_SHOP_NAMES = ["Rahim Traders", "Demo Power Tools Co."];

interface ProductSeed {
  title: string;
  shortDesc: string;
  fullDesc: string;
  category: string;
  price: number;
  condition: "new" | "used";
  stock: number;
}

const PRODUCTS: ProductSeed[] = [
  // power-tools
  { title: "Makita HP2050 Impact Drill", shortDesc: "720W corded impact drill with keyed chuck.", fullDesc: "13mm keyed chuck, 720W motor, variable speed, hammer/drill mode switch. Ideal for masonry and steel.", category: "power-tools", price: 74.99, condition: "new", stock: 20 },
  { title: "DeWalt DCD host Cordless Drill Driver", shortDesc: "18V brushless cordless drill driver.", fullDesc: "Compact brushless motor, 2-speed gearbox, LED work light, includes 2 batteries and fast charger.", category: "power-tools", price: 129.00, condition: "new", stock: 15 },
  { title: "Bosch GWS 7-100 Angle Grinder", shortDesc: "720W angle grinder, 100mm disc.", fullDesc: "Compact angle grinder with spindle lock, side handle, and protective guard. Great for cutting and polishing.", category: "power-tools", price: 54.50, condition: "new", stock: 18 },
  { title: "Ryobi ONE+ Cordless Jigsaw", shortDesc: "18V cordless jigsaw, tool-only.", fullDesc: "Variable speed trigger, tool-free blade change, bevel cutting up to 45 degrees. Battery sold separately.", category: "power-tools", price: 68.00, condition: "new", stock: 12 },
  { title: "Milwaukee M18 Impact Driver", shortDesc: "18V brushless impact driver, high torque.", fullDesc: "Compact brushless impact driver, 3-speed settings, 1/4-inch hex chuck, includes belt clip.", category: "power-tools", price: 145.00, condition: "new", stock: 10 },
  { title: "Total Industrial Circular Saw", shortDesc: "1200W circular saw, 185mm blade.", fullDesc: "Laser guide, adjustable bevel and depth, dust extraction port, comes with carbide-tipped blade.", category: "power-tools", price: 62.75, condition: "new", stock: 14 },

  // hand-tools
  { title: "Stanley 8-in-1 Screwdriver Set", shortDesc: "Multi-bit screwdriver with magnetic tips.", fullDesc: "Chrome vanadium steel bits, comfort-grip handle, includes Phillips, flathead, and Torx bits.", category: "hand-tools", price: 12.99, condition: "new", stock: 40 },
  { title: "Klein Tools Linesman Pliers", shortDesc: "9-inch heavy-duty linesman pliers.", fullDesc: "Induction-hardened cutting knives, high-leverage design, comfort-grip handles for electrical work.", category: "hand-tools", price: 24.50, condition: "new", stock: 30 },
  { title: "Craftsman 40-Piece Hand Tool Kit", shortDesc: "General-purpose hand tool set in carry case.", fullDesc: "Includes wrenches, pliers, screwdrivers, and a hammer, all packed in a durable carry case.", category: "hand-tools", price: 45.00, condition: "new", stock: 22 },
  { title: "Ingco Claw Hammer 16oz", shortDesc: "Fiberglass-handled claw hammer.", fullDesc: "Drop-forged steel head, shock-absorbing fiberglass handle, polished claw for nail removal.", category: "hand-tools", price: 9.99, condition: "new", stock: 50 },
  { title: "Stanley FatMax Utility Knife", shortDesc: "Retractable utility knife with lock.", fullDesc: "Quick-change blade mechanism, ergonomic non-slip grip, includes 3 spare blades.", category: "hand-tools", price: 7.50, condition: "new", stock: 60 },
  { title: "Bahco Adjustable Pipe Wrench 14-inch", shortDesc: "Heavy-duty pipe wrench, serrated jaws.", fullDesc: "Drop-forged steel construction, self-adjusting jaws, corrosion-resistant finish.", category: "hand-tools", price: 28.00, condition: "new", stock: 18 },

  // grinding
  { title: "Bosch GWS 2000 Professional Grinder", shortDesc: "2000W heavy-duty angle grinder.", fullDesc: "180mm disc capacity, anti-vibration side handle, restart protection, tool-free guard adjustment.", category: "grinding", price: 98.00, condition: "new", stock: 12 },
  { title: "Makita 9557NB Angle Grinder", shortDesc: "840W compact angle grinder, 100mm.", fullDesc: "Slide switch with lock-on, labyrinth construction protects against dust, includes wheel guard.", category: "grinding", price: 89.99, condition: "new", stock: 10 },
  { title: "DeWalt Bench Grinder 8-inch", shortDesc: "3/4HP bench grinder with dual wheels.", fullDesc: "Cast-iron base for stability, eye shields, adjustable tool rests, coarse and fine grinding wheels.", category: "grinding", price: 135.00, condition: "new", stock: 8 },
  { title: "Total Die Grinder 400W", shortDesc: "Compact electric die grinder.", fullDesc: "Variable speed control, collet sizes 6mm/8mm, ideal for detail grinding and polishing work.", category: "grinding", price: 42.00, condition: "new", stock: 16 },
  { title: "Ingco Angle Grinder 750W", shortDesc: "115mm angle grinder, entry-level.", fullDesc: "Lightweight design, safety guard, spindle lock for quick disc changes.", category: "grinding", price: 34.99, condition: "new", stock: 25 },

  // drilling
  { title: "Bosch GSB 13 RE Impact Drill (New Stock)", shortDesc: "600W impact drill for home and pro use.", fullDesc: "13mm chuck, variable speed, reverse function, includes carry case and spare chuck key.", category: "drilling", price: 85.00, condition: "new", stock: 20 },
  { title: "Makita HP1630 Impact Drill", shortDesc: "710W corded hammer drill.", fullDesc: "Keyed chuck, forward/reverse switch, side handle and depth gauge included.", category: "drilling", price: 79.50, condition: "new", stock: 16 },
  { title: "DeWalt Magnetic Drill Press", shortDesc: "Portable magnetic base drill press.", fullDesc: "Strong magnetic base for steel surfaces, variable speed control, includes safety chain.", category: "drilling", price: 320.00, condition: "new", stock: 5 },
  { title: "Total Cordless Drill 12V", shortDesc: "Compact 12V cordless drill with battery.", fullDesc: "Two-speed gearbox, LED light, includes charger and one battery pack.", category: "drilling", price: 48.00, condition: "new", stock: 28 },
  { title: "Ryobi Hammer Drill 750W", shortDesc: "Corded hammer drill, keyless chuck.", fullDesc: "13mm keyless chuck, hammer/drill mode selector, side auxiliary handle.", category: "drilling", price: 58.25, condition: "new", stock: 19 },

  // cutting
  { title: "Klein Tools Long Nose Pliers (Restock)", shortDesc: "Precision long nose pliers, induction-hardened.", fullDesc: "Induction-hardened jaws, wire cutter, comfort-grip handles for electrical and precision work.", category: "cutting", price: 19.99, condition: "new", stock: 35 },
  { title: "Stanley Tin Snips", shortDesc: "Heavy-duty straight-cut tin snips.", fullDesc: "High-carbon steel blades, comfort-grip handles, ideal for sheet metal and ductwork.", category: "cutting", price: 16.50, condition: "new", stock: 24 },
  { title: "Bahco Bolt Cutter 24-inch", shortDesc: "Heavy-duty bolt cutter, compound action.", fullDesc: "Compound leverage mechanism, hardened jaws, cuts bolts, chains, and padlocks up to 10mm.", category: "cutting", price: 55.00, condition: "new", stock: 10 },
  { title: "Total Hacksaw Frame", shortDesc: "Adjustable hacksaw with steel frame.", fullDesc: "Adjustable frame fits 10-12 inch blades, comfort-grip handle, tension knob for blade tightness.", category: "cutting", price: 8.75, condition: "new", stock: 45 },
  { title: "Ingco Tube Cutter", shortDesc: "Copper and PVC pipe cutter.", fullDesc: "Sharp cutting wheel, adjustable jaw for pipes up to 35mm, built-in reamer.", category: "cutting", price: 13.20, condition: "new", stock: 30 },

  // measuring
  { title: "Stanley 5m Tape Measure", shortDesc: "Compact tape measure with belt clip.", fullDesc: "Nylon-coated blade, magnetic hook, rubberized non-slip casing, belt clip included.", category: "measuring", price: 6.99, condition: "new", stock: 60 },
  { title: "Bosch GLM 50 Laser Distance Meter", shortDesc: "50m laser distance measurer.", fullDesc: "Accurate to +/-2mm, backlit display, area/volume calculation modes, compact design.", category: "measuring", price: 65.00, condition: "new", stock: 14 },
  { title: "Mitutoyo Digital Vernier Caliper", shortDesc: "150mm digital caliper, high precision.", fullDesc: "Stainless steel construction, LCD display, inch/mm conversion, ideal for machining work.", category: "measuring", price: 42.00, condition: "new", stock: 12 },
  { title: "Stabila Spirit Level 60cm", shortDesc: "Aluminum spirit level with 3 vials.", fullDesc: "Shock-absorbing end caps, high-precision vials, milled edges for accurate marking.", category: "measuring", price: 22.50, condition: "new", stock: 20 },
  { title: "Total Digital Angle Finder", shortDesc: "Digital protractor and angle finder.", fullDesc: "Magnetic base, LCD readout, measures angles from 0-225 degrees with high accuracy.", category: "measuring", price: 18.00, condition: "new", stock: 18 },

  // fasteners
  { title: "Assorted Machine Screw Set (500pc)", shortDesc: "Metric machine screws, mixed sizes.", fullDesc: "Zinc-plated steel screws, M3 to M8, includes matching nuts and washers, organized case.", category: "fasteners", price: 15.99, condition: "new", stock: 40 },
  { title: "Stainless Steel Bolt & Nut Kit", shortDesc: "Corrosion-resistant bolt and nut assortment.", fullDesc: "304 stainless steel, various lengths and diameters, ideal for outdoor and marine use.", category: "fasteners", price: 21.00, condition: "new", stock: 25 },
  { title: "Heavy-Duty Anchor Bolt Set", shortDesc: "Expansion anchor bolts for concrete.", fullDesc: "Galvanized steel, wedge-style expansion, suitable for heavy load-bearing concrete anchoring.", category: "fasteners", price: 27.50, condition: "new", stock: 20 },
  { title: "Self-Tapping Screw Assortment", shortDesc: "Sheet metal self-tapping screws.", fullDesc: "Hardened steel, sharp point for fast starts, mixed sizes in a compact organizer box.", category: "fasteners", price: 11.25, condition: "new", stock: 35 },
  { title: "Rivet Gun with Rivet Assortment", shortDesc: "Hand rivet gun with mixed rivets.", fullDesc: "Heavy-duty steel construction, includes aluminum and steel rivets in multiple sizes.", category: "fasteners", price: 19.75, condition: "new", stock: 22 },

  // safety-gear
  { title: "3M Safety Goggles Clear Lens", shortDesc: "Anti-fog clear safety goggles.", fullDesc: "Impact-resistant polycarbonate lens, adjustable strap, meets ANSI Z87.1 standard.", category: "safety-gear", price: 8.99, condition: "new", stock: 50 },
  { title: "Welding Helmet Auto-Darkening", shortDesc: "Auto-darkening welding helmet.", fullDesc: "Adjustable shade range 9-13, solar-powered sensor, comfortable headgear with ratchet adjustment.", category: "safety-gear", price: 48.00, condition: "new", stock: 15 },
  { title: "Heavy-Duty Work Gloves (Pack of 3)", shortDesc: "Leather palm work gloves.", fullDesc: "Reinforced leather palm, breathable back, elastic wrist for secure fit during heavy tasks.", category: "safety-gear", price: 14.50, condition: "new", stock: 40 },
  { title: "Steel Toe Safety Boots", shortDesc: "Slip-resistant steel toe boots.", fullDesc: "Steel toe cap, puncture-resistant sole, oil and slip-resistant outsole, all-day comfort.", category: "safety-gear", price: 55.00, condition: "new", stock: 18 },
  { title: "3M Ear Muff Hearing Protection", shortDesc: "Noise-reducing ear muffs, NRR 25dB.", fullDesc: "Adjustable padded headband, foam ear cushions, foldable design for storage.", category: "safety-gear", price: 16.00, condition: "new", stock: 30 },

  // welding
  { title: "Lincoln Electric MIG Welder 140A", shortDesc: "140A MIG welder for home workshops.", fullDesc: "Wire-feed welding, adjustable voltage control, works on 110V/220V, includes welding gun and ground clamp.", category: "welding", price: 415.00, condition: "new", stock: 6 },
  { title: "Total Arc Welding Machine 200A", shortDesc: "Inverter arc welder, 200A output.", fullDesc: "Lightweight inverter design, digital display, hot start and anti-stick functions.", category: "welding", price: 155.00, condition: "new", stock: 10 },
  { title: "Welding Rod Set E6013 (5kg)", shortDesc: "General-purpose welding electrodes.", fullDesc: "Smooth arc characteristics, suitable for mild steel welding in all positions.", category: "welding", price: 24.00, condition: "new", stock: 25 },
  { title: "Welding Clamp & Ground Cable Set", shortDesc: "Heavy-duty ground clamp and cable.", fullDesc: "Copper-plated jaws for strong conductivity, 3-meter cable, spring-loaded clamp.", category: "welding", price: 18.50, condition: "new", stock: 20 },
  { title: "Chipping Hammer & Wire Brush Combo", shortDesc: "Welding slag chipping hammer with brush.", fullDesc: "Dual-head design for slag removal and cleaning, insulated rubber handle.", category: "welding", price: 9.50, condition: "new", stock: 30 },

  // generators
  { title: "Honda EU2200i Inverter Generator", shortDesc: "2200W portable inverter generator.", fullDesc: "Quiet operation, fuel-efficient inverter technology, parallel-capable, ideal for home backup.", category: "generators", price: 999.00, condition: "new", stock: 4 },
  { title: "Total Portable Generator 3000W", shortDesc: "Gasoline-powered 3000W generator.", fullDesc: "Recoil start, dual AC outlets, low-oil shutdown protection, compact wheeled frame.", category: "generators", price: 385.00, condition: "new", stock: 7 },
  { title: "Ingco Diesel Generator 5000W", shortDesc: "Heavy-duty diesel generator, 5000W.", fullDesc: "Electric start, large fuel tank for extended runtime, ideal for job sites and workshops.", category: "generators", price: 720.00, condition: "new", stock: 3 },
  { title: "Compact Inverter Generator 1000W", shortDesc: "Lightweight 1000W inverter generator.", fullDesc: "Ultra-quiet operation, USB output ports, ideal for camping and small appliances.", category: "generators", price: 245.00, condition: "new", stock: 12 },
  { title: "Standby Generator Transfer Switch", shortDesc: "Manual transfer switch for generators.", fullDesc: "Safely connects portable generators to home circuits, supports up to 30A, weatherproof enclosure.", category: "generators", price: 165.00, condition: "new", stock: 8 },
];

async function seedBulkProducts() {
  await connectDB();
  const auth = await getAuth();
  const users = usersCollection();
  const shops = shopsCollection();
  const products = productsCollection();

  const shopIds: ObjectId[] = [];

  for (const name of EXISTING_SHOP_NAMES) {
    const shop = await shops.findOne({ shopName: name });
    if (shop?._id) {
      shopIds.push(shop._id);
      console.log(`Using existing shop: ${name}`);
    } else {
      console.warn(`Existing shop not found, skipping: ${name}`);
    }
  }

  for (const seller of NEW_SELLERS) {
    let user = await users.findOne({ email: seller.email });
    if (!user) {
      await auth.api.signUpEmail({
        body: { name: seller.name, email: seller.email, password: DEMO_PASSWORD },
      });
      user = await users.findOne({ email: seller.email });
      console.log(`Created seller account: ${seller.email}`);
    }
    if (!user) throw new Error(`Failed to create/find user ${seller.email}`);
    if (user.role !== "seller") {
      await users.updateOne({ _id: user._id }, { $set: { role: "seller" } });
    }

    let shop = await shops.findOne({ ownerUserId: user._id });
    if (!shop) {
      const result = await shops.insertOne({
        ownerUserId: user._id!,
        shopName: seller.shopName,
        description: seller.description,
        address: seller.address,
        feePaid: true,
        status: "active",
        createdAt: new Date(),
      });
      shop = await shops.findOne({ _id: result.insertedId });
      console.log(`Created shop: ${seller.shopName}`);
    }
    if (!shop) throw new Error(`Failed to create/find shop for ${seller.email}`);
    shopIds.push(shop._id!);
  }

  console.log(`\nDistributing ${PRODUCTS.length} products across ${shopIds.length} shops...`);

  let inserted = 0;
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const shopId = shopIds[i % shopIds.length];
    const image = CATEGORY_IMAGES[p.category];

    const exists = await products.findOne({ title: p.title, shopId });
    if (exists) continue;

    await products.insertOne({
      shopId,
      title: p.title,
      shortDesc: p.shortDesc,
      fullDesc: p.fullDesc,
      category: p.category,
      price: p.price,
      condition: p.condition,
      stock: p.stock,
      images: image ? [image] : [],
      status: "approved",
      ratingAvg: 0,
      ratingCount: 0,
      createdAt: new Date(),
    });
    inserted++;
  }

  console.log(`Inserted ${inserted} new products.`);

  // Backfill images on any existing products missing one
  const missingImages = await products.find({ $or: [{ images: { $size: 0 } }, { images: { $exists: false } }] }).toArray();
  let backfilled = 0;
  for (const prod of missingImages) {
    const image = CATEGORY_IMAGES[prod.category];
    if (!image) continue;
    await products.updateOne({ _id: prod._id }, { $set: { images: [image] } });
    backfilled++;
  }
  console.log(`Backfilled images on ${backfilled} existing products.`);

  process.exit(0);
}

seedBulkProducts().catch((err) => {
  console.error("Bulk product seed failed:", err);
  process.exit(1);
});
