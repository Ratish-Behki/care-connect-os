import { randomUUID } from "crypto";
import { Router } from "express";
import { createNotification, db } from "../data/store.js";

const router = Router();

const TRIAGE_RULES = [
  {
    id: "chest_emergency",
    severity: "high",
    careSetting: "emergency",
    department: "Emergency / Cardiology",
    baseConfidence: 97,
    anyOf: [/\bchest pain\b/, /\bpressure in chest\b/, /\btightness in chest\b/, /\bshortness of breath\b/, /\bdifficulty breathing\b/, /\btrouble breathing\b/, /\bblue lips\b/, /\bpalpitations\b/],
    possibleConditions: ["Heart attack / cardiac event", "Severe asthma or breathing problem", "Panic attack"],
    actions: ["Call emergency services now", "Do not drive yourself if symptoms are severe", "Sit upright and keep calm"],
    homeCare: ["Avoid exertion", "Use a prescribed rescue inhaler only if you already have one", "Unlock the door and keep your phone nearby"],
    redFlags: ["Pain spreading to arm, jaw, back, or shoulder", "Sweating, nausea, or fainting", "Breathing becomes very difficult"],
    summary: "Chest pain or breathing trouble can be life-threatening and needs immediate evaluation.",
  },
  {
    id: "stroke_emergency",
    severity: "high",
    careSetting: "emergency",
    department: "Emergency / Neurology",
    baseConfidence: 98,
    anyOf: [/\bface droop\b/, /\bslurred speech\b/, /\bone[- ]sided weakness\b/, /\bweakness on one side\b/, /\bconfusion\b/, /\bvision loss\b/, /\bsevere dizziness\b/, /\bnumbness\b/],
    possibleConditions: ["Stroke / TIA", "Severe migraine with neurologic symptoms", "Low blood sugar or other emergency"],
    actions: ["Call emergency services immediately", "Note the exact time symptoms started", "Do not give food or drink if swallowing is difficult"],
    homeCare: ["Keep the person safe from falls", "Do not delay for sleep or rest", "Prepare medication list and ID"],
    redFlags: ["Face drooping", "Speech changes", "Sudden weakness or confusion"],
    summary: "Sudden neurologic symptoms can be a stroke until proven otherwise.",
  },
  {
    id: "allergy_emergency",
    severity: "high",
    careSetting: "emergency",
    department: "Emergency / Allergy",
    baseConfidence: 96,
    anyOf: [/\bhives\b/, /\bface swelling\b/, /\blip swelling\b/, /\btongue swelling\b/, /\bitchy rash\b/, /\bwheezing\b/, /\ballergic reaction\b/, /\bthroat closing\b/],
    possibleConditions: ["Severe allergic reaction / anaphylaxis", "Medication allergy", "Food allergy"],
    actions: ["Use epinephrine if prescribed", "Call emergency services now", "Avoid the trigger if known"],
    homeCare: ["Stay seated upright", "Do not eat or drink if swallowing is hard", "Bring the trigger information to the hospital"],
    redFlags: ["Throat tightness", "Breathing difficulty", "Dizziness or collapse"],
    summary: "Allergic reactions with swelling or breathing problems can become an emergency quickly.",
  },
  {
    id: "trauma_emergency",
    severity: "high",
    careSetting: "emergency",
    department: "Emergency / Trauma",
    baseConfidence: 95,
    anyOf: [/\bsevere bleeding\b/, /\bdeep cut\b/, /\bhead injury\b/, /\bfracture\b/, /\bbroken bone\b/, /\bburn\b/, /\bseizure\b/, /\bfainting\b/, /\bunconscious\b/],
    possibleConditions: ["Significant injury / trauma", "Fracture", "Head injury", "Seizure-related emergency"],
    actions: ["Apply direct pressure to bleeding if safe", "Call emergency services for severe injury", "Avoid moving the person if a head or neck injury is possible"],
    homeCare: ["Keep the injured area still", "Use a clean cloth for pressure", "Do not apply creams to deep wounds"],
    redFlags: ["Bleeding that will not stop", "Loss of consciousness", "Severe burn or deformity"],
    summary: "Serious injuries need urgent assessment, especially with bleeding, head injury, or fainting.",
  },
  {
    id: "fever_flu",
    severity: "medium",
    careSetting: "primary-care",
    department: "General Medicine / Family Medicine",
    baseConfidence: 86,
    anyOf: [/\bfever\b/, /\bchills\b/, /\bbody aches\b/, /\bfatigue\b/, /\bcough\b/, /\bsore throat\b/, /\brunny nose\b/, /\bnasal congestion\b/],
    possibleConditions: ["Viral infection / flu-like illness", "Common cold", "Sinus infection"],
    actions: ["Rest and hydrate", "Monitor temperature", "Book a same-day or next-day clinic visit if fever is high or lasts more than 2 to 3 days"],
    homeCare: ["Drink fluids often", "Use acetaminophen or ibuprofen only if you normally can take them", "Use a humidifier or warm drinks for throat irritation"],
    redFlags: ["Fever with trouble breathing", "Fever lasting more than 3 days", "Confusion or dehydration"],
    summary: "This looks most consistent with a common viral illness, but watch for worsening fever or breathing problems.",
  },
  {
    id: "headache_migraine",
    severity: "medium",
    careSetting: "primary-care",
    department: "General Medicine / Neurology",
    baseConfidence: 84,
    anyOf: [/\bheadache\b/, /\bmigraine\b/, /\bthrobbing head\b/, /\bsensitive to light\b/, /\bnausea with headache\b/, /\bpressure headache\b/],
    possibleConditions: ["Tension headache", "Migraine", "Sinus-related headache"],
    actions: ["Rest in a dark quiet room", "Hydrate", "Track triggers like sleep, stress, and screen time"],
    homeCare: ["Reduce screen brightness", "Try a cold pack on the forehead", "Avoid skipping meals"],
    redFlags: ["Sudden worst headache of life", "Headache with fever and stiff neck", "Headache with weakness or confusion"],
    summary: "Common headaches are often related to stress, dehydration, or migraine patterns.",
  },
  {
    id: "stomach_digestion",
    severity: "medium",
    careSetting: "primary-care",
    department: "General Medicine / Gastroenterology",
    baseConfidence: 85,
    anyOf: [/\bstomach pain\b/, /\babdominal pain\b/, /\bbelly pain\b/, /\bnausea\b/, /\bvomiting\b/, /\bdiarrhea\b/, /\bconstipation\b/, /\bheartburn\b/, /\bbloating\b/, /\bindigestion\b/],
    possibleConditions: ["Gastroenteritis", "Acid reflux / indigestion", "Constipation", "Food poisoning"],
    actions: ["Sip fluids frequently", "Eat bland foods if tolerated", "Seek care sooner if pain is severe, localized, or with blood"],
    homeCare: ["Avoid greasy or heavy meals", "Try oral rehydration if diarrhea or vomiting is present", "Rest and monitor bowel movements"],
    redFlags: ["Blood in vomit or stool", "Severe right-sided pain", "Dehydration or repeated vomiting"],
    summary: "This pattern is often digestive, but severe or one-sided abdominal pain needs more urgent evaluation.",
  },
  {
    id: "urinary_issues",
    severity: "medium",
    careSetting: "primary-care",
    department: "Urology / General Medicine",
    baseConfidence: 88,
    anyOf: [/\bburning urination\b/, /\bpain when urinating\b/, /\bfrequent urination\b/, /\burgent urination\b/, /\bcloudy urine\b/, /\bflank pain\b/, /\bback pain with urination\b/],
    possibleConditions: ["Urinary tract infection", "Bladder irritation", "Kidney stone"],
    actions: ["Increase fluids", "Book a clinic visit for urine testing", "Go sooner if fever or flank pain appears"],
    homeCare: ["Do not hold urine for long periods", "Avoid bladder irritants like too much caffeine", "Track urine color and frequency"],
    redFlags: ["Fever with urinary pain", "Blood in urine", "Severe side or back pain"],
    summary: "Urinary burning or urgency often points to an infection or irritation and usually needs testing.",
  },
  {
    id: "muscle_joint_pain",
    severity: "low",
    careSetting: "self-care",
    department: "Orthopedics / General Medicine",
    baseConfidence: 80,
    anyOf: [/\bback pain\b/, /\bneck pain\b/, /\bjoint pain\b/, /\bmuscle pain\b/, /\bsprain\b/, /\bstrain\b/, /\bknee pain\b/, /\bshoulder pain\b/],
    possibleConditions: ["Muscle strain", "Posture-related pain", "Mild sprain"],
    actions: ["Rest the area", "Use ice for the first 24 to 48 hours after a strain", "Book care if pain is severe or lasts more than a week"],
    homeCare: ["Gentle stretching if it does not worsen pain", "Over-the-counter pain relief if safe for you", "Improve posture and ergonomic support"],
    redFlags: ["Swelling after a fall", "Inability to bear weight", "Numbness or weakness"],
    summary: "This is often a muscle or joint strain from everyday activity, posture, or overuse.",
  },
  {
    id: "dizziness_fatigue",
    severity: "low",
    careSetting: "self-care",
    department: "General Medicine",
    baseConfidence: 77,
    anyOf: [/\bdizziness\b/, /\blightheaded\b/, /\bfatigue\b/, /\bweakness\b/, /\bdehydration\b/, /\bfaint feeling\b/, /\btired all the time\b/],
    possibleConditions: ["Dehydration", "Poor sleep", "Viral illness", "Low energy / stress"],
    actions: ["Hydrate and eat regular meals", "Check if symptoms improve with rest", "Seek care if dizziness keeps happening"],
    homeCare: ["Stand up slowly", "Drink water or oral rehydration", "Prioritize sleep and regular meals"],
    redFlags: ["Actual fainting", "Chest pain or shortness of breath", "Severe persistent weakness"],
    summary: "Dizziness and fatigue are often from dehydration, low sleep, illness, or low intake.",
  },
  {
    id: "skin_allergy",
    severity: "low",
    careSetting: "self-care",
    department: "Dermatology / Allergy",
    baseConfidence: 78,
    anyOf: [/\brash\b/, /\bitching\b/, /\bitchy skin\b/, /\bhives\b/, /\beczema\b/, /\binsect bite\b/, /\bskin redness\b/],
    possibleConditions: ["Mild allergy", "Eczema", "Insect bite reaction", "Skin irritation"],
    actions: ["Avoid scratching", "Use a gentle moisturizer", "Book care if the rash spreads or becomes painful"],
    homeCare: ["Use cool compresses", "Try a fragrance-free moisturizer", "Identify any new soaps, foods, or medicines"],
    redFlags: ["Swelling of lips or face", "Rash with breathing trouble", "Rapidly spreading rash with fever"],
    summary: "Most everyday skin rashes are irritation or mild allergy, but swelling or breathing trouble is urgent.",
  },
  {
    id: "eye_symptoms",
    severity: "low",
    careSetting: "self-care",
    department: "Ophthalmology / General Medicine",
    baseConfidence: 76,
    anyOf: [/\bred eyes\b/, /\bitchy eyes\b/, /\beye discharge\b/, /\bstye\b/, /\bblurred vision\b/, /\bdry eyes\b/],
    possibleConditions: ["Conjunctivitis", "Dry eye", "Allergy", "Stye"],
    actions: ["Avoid rubbing the eyes", "Use clean compresses for a stye", "Seek care if vision changes or pain is severe"],
    homeCare: ["Wash hands often", "Use artificial tears if you already have them", "Remove contact lenses if irritation starts"],
    redFlags: ["Vision loss", "Severe eye pain", "Eye injury or chemical exposure"],
    summary: "Eye redness or irritation is often minor, but pain or vision loss needs prompt evaluation.",
  },
  {
    id: "ear_symptoms",
    severity: "low",
    careSetting: "self-care",
    department: "ENT",
    baseConfidence: 75,
    anyOf: [/\bear pain\b/, /\bblocked ear\b/, /\bear fullness\b/, /\bhearing loss\b/, /\bear itch\b/],
    possibleConditions: ["Ear infection", "Wax buildup", "Eustachian tube pressure"],
    actions: ["Do not put objects into the ear", "Book care if pain or hearing loss persists", "Seek urgent care if fever or discharge appears"],
    homeCare: ["Use a warm compress for pain relief", "Keep the ear dry", "Track whether symptoms follow a cold or allergy"],
    redFlags: ["Sudden hearing loss", "Drainage with severe pain", "Dizziness with ear symptoms"],
    summary: "Ear pain or blockage is commonly from infection, wax, or pressure changes.",
  },
  {
    id: "dental_oral",
    severity: "low",
    careSetting: "self-care",
    department: "Dentistry / General Medicine",
    baseConfidence: 76,
    anyOf: [/\btoothache\b/, /\bgum pain\b/, /\bmouth ulcer\b/, /\bjaw pain\b/, /\btooth sensitivity\b/],
    possibleConditions: ["Dental cavity", "Gum inflammation", "Mouth ulcer", "Teeth grinding"],
    actions: ["Book a dentist visit", "Use salt-water rinses if helpful", "Seek urgent care if swelling or fever develops"],
    homeCare: ["Avoid very hot or cold foods if sensitive", "Brush gently", "Take note of which tooth hurts"],
    redFlags: ["Facial swelling", "Fever with tooth pain", "Trouble swallowing or opening the mouth"],
    summary: "Tooth or gum pain is usually dental, and early treatment prevents worsening.",
  },
  {
    id: "menstrual_pelvic",
    severity: "low",
    careSetting: "self-care",
    department: "Gynecology / General Medicine",
    baseConfidence: 78,
    anyOf: [/\bperiod cramps\b/, /\bmenstrual cramps\b/, /\bheavy bleeding\b/, /\birregular period\b/, /\bpelvic pain\b/, /\bpms\b/],
    possibleConditions: ["Menstrual cramps", "PMS", "Hormonal irregularity"],
    actions: ["Track cycle timing and symptoms", "Use gentle pain relief if safe", "Book care if bleeding is very heavy or cycles are very irregular"],
    homeCare: ["Heat pad on the lower abdomen", "Hydrate and rest", "Track flow and pain severity"],
    redFlags: ["Very heavy bleeding", "Severe one-sided pelvic pain", "Fainting or pregnancy-related concern"],
    summary: "Many menstrual symptoms are common, but heavy bleeding or severe pelvic pain should be checked.",
  },
  {
    id: "stress_sleep",
    severity: "low",
    careSetting: "self-care",
    department: "General Medicine / Behavioral Health",
    baseConfidence: 74,
    anyOf: [/\binsomnia\b/, /\bstress\b/, /\banxiety\b/, /\bpanic\b/, /\bpoor sleep\b/, /\bcan\'t sleep\b/, /\boverthinking\b/],
    possibleConditions: ["Stress / sleep disruption", "Anxiety symptoms", "Poor sleep hygiene"],
    actions: ["Try a consistent sleep schedule", "Reduce caffeine late in the day", "Seek professional help if anxiety or insomnia persists"],
    homeCare: ["Keep the room dark and cool", "Limit screens before bed", "Use breathing exercises for short-term calming"],
    redFlags: ["Panic with chest pain or fainting", "Severe insomnia for many nights", "Thoughts of self-harm"],
    summary: "Stress and sleep problems are common day-to-day issues, but persistent symptoms deserve follow-up.",
  },
  {
    id: "digestive_mild",
    severity: "low",
    careSetting: "self-care",
    department: "General Medicine / Gastroenterology",
    baseConfidence: 79,
    anyOf: [/\bgas\b/, /\bbloating\b/, /\bconstipation\b/, /\bindigestion\b/, /\bheartburn\b/, /\bacid reflux\b/, /\bcramps\b/],
    possibleConditions: ["Indigestion", "Constipation", "Acid reflux", "Gas buildup"],
    actions: ["Try small meals and fluids", "Increase fiber gradually for constipation", "Book care if pain persists or vomiting starts"],
    homeCare: ["Avoid lying down right after eating", "Walk gently after meals", "Limit trigger foods that worsen reflux"],
    redFlags: ["Severe abdominal pain", "Blood in stool", "Persistent vomiting"],
    summary: "Mild digestive symptoms are often diet or acid-related and can improve with simple changes.",
  },
];

function normalizeText(symptoms) {
  return symptoms
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMatches(text, rules) {
  return rules
    .map((rule) => {
      const allOf = rule.allOf ?? [];
      const anyOf = rule.anyOf ?? [];
      const allMatched = allOf.every((pattern) => pattern.test(text));
      const anyMatched = anyOf.length === 0 || anyOf.some((pattern) => pattern.test(text));

      if (!allMatched || !anyMatched) {
        return null;
      }

      const matchedPatterns = [
        ...allOf.filter((pattern) => pattern.test(text)),
        ...anyOf.filter((pattern) => pattern.test(text)),
      ];

      const confidence = Math.min(99, rule.baseConfidence + matchedPatterns.length * 3 + (allOf.length > 0 ? 4 : 0));
      const score = (rule.severity === "high" ? 300 : rule.severity === "medium" ? 200 : 100) + confidence;

      return {
        rule,
        confidence,
        score,
        matchedPatterns: matchedPatterns.length,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

function buildResult(symptoms) {
  const text = normalizeText(symptoms);
  const matches = getMatches(text, TRIAGE_RULES);
  const topMatches = matches.slice(0, 3);

  if (topMatches.length === 0) {
    return {
      severity: "low",
      confidence: 70,
      careSetting: "self-care",
      recommendedDepartment: "General Medicine",
      possibleConditions: ["Minor viral illness", "Temporary irritation", "Stress or fatigue"],
      actions: ["Monitor symptoms for 24 to 48 hours", "Hydrate and rest", "Book a clinic visit if symptoms persist or worsen"],
      homeCare: ["Keep a symptom diary", "Rest and hydrate", "Use simple over-the-counter remedies only if you normally can take them"],
      redFlags: ["Symptoms suddenly worsen", "New fever or severe pain", "Trouble breathing or fainting"],
      followUp: "If the symptom is still present after 48 to 72 hours, book a primary care visit.",
      summary: "I could not map this to a specific pattern, so this looks like a nonspecific symptom needing watchful waiting.",
    };
  }

  const highestSeverity = topMatches.some((match) => match.rule.severity === "high")
    ? "high"
    : topMatches.some((match) => match.rule.severity === "medium")
      ? "medium"
      : "low";

  const severityConfidence = Math.min(
    99,
    Math.round(topMatches.reduce((total, match) => total + match.confidence, 0) / topMatches.length)
  );

  const careSetting = topMatches[0].rule.careSetting;
  const recommendedDepartment = topMatches[0].rule.department;
  const possibleConditions = [...new Set(topMatches.flatMap((match) => match.rule.possibleConditions))].slice(0, 6);
  const actions = [...new Set(topMatches.flatMap((match) => match.rule.actions))].slice(0, 5);
  const homeCare = [...new Set(topMatches.flatMap((match) => match.rule.homeCare))].slice(0, 5);
  const redFlags = [...new Set(topMatches.flatMap((match) => match.rule.redFlags))].slice(0, 5);
  const summary = topMatches[0].rule.summary;

  const followUp =
    highestSeverity === "high"
      ? "Seek emergency care now. If you cannot get there safely, call emergency services immediately."
      : highestSeverity === "medium"
        ? "Book a same-day or next-day visit with a clinician. Go sooner if symptoms worsen."
        : "Home care is reasonable first. Book a routine visit if the symptom lasts more than 2 to 3 days or keeps returning.";

  return {
    severity: highestSeverity,
    confidence: severityConfidence,
    careSetting,
    recommendedDepartment,
    possibleConditions,
    actions,
    homeCare,
    redFlags,
    followUp,
    summary,
  };
}

router.post("/", (req, res) => {
  const { symptoms } = req.body ?? {};

  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ message: "Symptoms are required." });
  }

  const result = buildResult(symptoms);
  const request = {
    id: randomUUID(),
    patientId: db.currentUser.id,
    symptoms,
    result,
    createdAt: new Date().toISOString(),
  };

  db.triageRequests.unshift(request);

  createNotification({
    recipientRole: "patient",
    type: "triage",
    priority: result.severity === "high" ? "high" : "medium",
    title: `Triage result: ${result.severity.toUpperCase()}`,
    description: result.recommendedDepartment,
    link: "/symptom-triage",
  });

  if (result.severity === "high") {
    createNotification({
      recipientRole: "doctor",
      type: "triage",
      priority: "high",
      title: "High priority symptom alert",
      description: result.recommendedDepartment,
      link: "/symptom-triage",
    });

    createNotification({
      recipientRole: "ambulance",
      type: "triage",
      priority: "high",
      title: "High severity triage case",
      description: "Emergency response may be needed.",
      link: "/symptom-triage",
    });
  }

  return res.json({ result });
});

export default router;