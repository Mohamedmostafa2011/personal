import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MoleculeCanvas, type MoleculeId } from "./MoleculeViewer";

type MoleculeInfo = {
  id: MoleculeId;
  shortName: string;
  name: string;
  family: string;
  classification: string;
  formula: string;
  summary: string;
  buildingBlock: string;
  structure: string;
};

const molecules: MoleculeInfo[] = [
  {
    id: "glucose",
    shortName: "Glucose",
    name: "Glucose",
    family: "Carbohydrate",
    classification: "Monosaccharide",
    formula: "C6H12O6",
    summary: "A single, soluble sugar unit. Glucose is a fuel for cells and a building block for larger carbohydrates.",
    buildingBlock: "A monomer",
    structure: "One sugar ring",
  },
  {
    id: "sucrose",
    shortName: "Sucrose",
    name: "Sucrose",
    family: "Carbohydrate",
    classification: "Disaccharide",
    formula: "C12H22O11",
    summary: "Table sugar: one glucose joined to one fructose by a glycosidic bond.",
    buildingBlock: "Two sugars",
    structure: "Glucose + fructose",
  },
  {
    id: "starch",
    shortName: "Starch",
    name: "Starch",
    family: "Carbohydrate",
    classification: "Polysaccharide",
    formula: "(C6H10O5)n",
    summary: "A plant storage carbohydrate made from many glucose units linked into a long chain.",
    buildingBlock: "Glucose units",
    structure: "A carbohydrate polymer",
  },
  {
    id: "lipid",
    shortName: "Triglyceride",
    name: "Triglyceride",
    family: "Lipid",
    classification: "Fat or oil",
    formula: "C3H5(OCO-R)3",
    summary: "A glycerol backbone joined to three fatty acids. The long hydrocarbon tails make it hydrophobic.",
    buildingBlock: "Glycerol + 3 fatty acids",
    structure: "Three fatty-acid tails",
  },
  {
    id: "peptide",
    shortName: "Polypeptide",
    name: "Polypeptide",
    family: "Protein",
    classification: "Amino-acid polymer",
    formula: "Sequence varies",
    summary: "A chain of amino acids joined by peptide bonds. It folds into a specific shape to become part of a protein.",
    buildingBlock: "Amino acids",
    structure: "Peptide-bonded chain",
  },
];

type TestId = "iodine" | "benedict" | "emulsion" | "biuret";

type FoodSample = {
  id: string;
  name: string;
  contents: string[];
};

type TestInfo = {
  id: TestId;
  name: string;
  target: string;
  shortTarget: string;
  reagent: string;
  intro: string;
  method: string[];
  startingColor: string;
  positiveColor: string;
  negativeColor: string;
  positiveOutcome: string;
  negativeOutcome: string;
};

const tests: TestInfo[] = [
  {
    id: "iodine",
    name: "Iodine test",
    target: "starch",
    shortTarget: "Starch",
    reagent: "Iodine solution",
    intro: "A quick colour test for starch in a food extract.",
    method: ["Add a few drops of iodine solution to the sample.", "Mix gently and allow the colour to settle.", "Look for a blue-black colour."],
    startingColor: "#c9984c",
    positiveColor: "#18263a",
    negativeColor: "#c9984c",
    positiveOutcome: "Blue-black: starch is present.",
    negativeOutcome: "Yellow-brown: no starch detected.",
  },
  {
    id: "benedict",
    name: "Benedict's test",
    target: "reducingSugar",
    shortTarget: "Reducing sugar",
    reagent: "Benedict's solution",
    intro: "Benedict's reagent detects reducing sugars such as glucose. Sucrose is not reducing unless it is first broken down.",
    method: ["Add Benedict's solution to the sample.", "Warm the tube in a hot-water bath.", "Compare the final colour with the starting blue."],
    startingColor: "#3f83aa",
    positiveColor: "#c95234",
    negativeColor: "#3f83aa",
    positiveOutcome: "Orange-red: reducing sugar is present.",
    negativeOutcome: "Blue: no reducing sugar detected.",
  },
  {
    id: "emulsion",
    name: "Ethanol emulsion",
    target: "lipid",
    shortTarget: "Lipid",
    reagent: "Ethanol, then water",
    intro: "Lipids dissolve in ethanol but not in water, producing a cloudy emulsion.",
    method: ["Shake the sample with ethanol.", "Pour the ethanol extract into water.", "Look for a cloudy, milky-white emulsion."],
    startingColor: "#b59a69",
    positiveColor: "#eff0e9",
    negativeColor: "#dce5df",
    positiveOutcome: "Cloudy white: lipid is present.",
    negativeOutcome: "Clear: no lipid detected.",
  },
  {
    id: "biuret",
    name: "Biuret test",
    target: "protein",
    shortTarget: "Protein",
    reagent: "Biuret reagent",
    intro: "Copper ions in alkaline solution react with peptide bonds in proteins.",
    method: ["Add alkaline Biuret reagent (sodium hydroxide and copper sulfate).", "Mix carefully and wait for the colour to develop.", "Look for a lilac or purple colour."],
    startingColor: "#397fa4",
    positiveColor: "#8b5ba8",
    negativeColor: "#397fa4",
    positiveOutcome: "Lilac-purple: protein is present.",
    negativeOutcome: "Blue: no protein detected.",
  },
];

const samples: FoodSample[] = [
  { id: "potato", name: "Potato extract", contents: ["starch"] },
  { id: "glucose", name: "Glucose solution", contents: ["reducingSugar"] },
  { id: "oil", name: "Vegetable oil", contents: ["lipid"] },
  { id: "egg", name: "Egg-white solution", contents: ["protein"] },
  { id: "water", name: "Distilled water", contents: [] },
];

function BrandMark() {
  return (
    <a className="brand" href="#top" aria-label="Biology field guide home">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 42 42" fill="none">
          <circle cx="21" cy="21" r="15.5" />
          <ellipse cx="21" cy="21" rx="7" ry="15.5" transform="rotate(45 21 21)" />
          <circle className="brand-core" cx="21" cy="21" r="3.2" />
        </svg>
      </span>
      <span className="brand-copy">
        <strong>FIELD GUIDE</strong>
        <span>BIOLOGY / 01</span>
      </span>
    </a>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2.5v10M4.5 9.5 8 13l3.5-3.5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.4 6.2A6 6 0 1 1 3 9" />
      <path d="M3.4 2.8v3.9h3.9" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5.5 3.8 14 9l-8.5 5.2V3.8Z" />
    </svg>
  );
}

function App() {
  const [selectedMolecule, setSelectedMolecule] = useState<MoleculeId>("glucose");
  const [rotationOn, setRotationOn] = useState(true);
  const [resetVersion, setResetVersion] = useState(0);
  const [selectedTest, setSelectedTest] = useState<TestId>("iodine");
  const [selectedSample, setSelectedSample] = useState("potato");
  const [testStage, setTestStage] = useState(0);
  const timerIds = useRef<number[]>([]);

  const activeMolecule = molecules.find((molecule) => molecule.id === selectedMolecule) ?? molecules[0];
  const activeTest = tests.find((test) => test.id === selectedTest) ?? tests[0];
  const activeSample = samples.find((sample) => sample.id === selectedSample) ?? samples[0];
  const isPositive = activeSample.contents.includes(activeTest.target);
  const displayedColor = testStage >= 2
    ? isPositive ? activeTest.positiveColor : activeTest.negativeColor
    : activeTest.startingColor;
  const resultText = isPositive ? activeTest.positiveOutcome : activeTest.negativeOutcome;

  useEffect(() => {
    timerIds.current.forEach((timerId) => window.clearTimeout(timerId));
    timerIds.current = [];
    setTestStage(0);
  }, [selectedTest, selectedSample]);

  useEffect(() => () => timerIds.current.forEach((timerId) => window.clearTimeout(timerId)), []);

  const runTest = () => {
    timerIds.current.forEach((timerId) => window.clearTimeout(timerId));
    setTestStage(1);
    timerIds.current = [
      window.setTimeout(() => setTestStage(2), 950),
      window.setTimeout(() => setTestStage(3), selectedTest === "benedict" ? 2650 : 2050),
    ];
  };

  const stageLabel = testStage === 0
    ? "Ready when you are"
    : testStage === 1
      ? selectedTest === "emulsion" ? "Mixing with ethanol" : "Adding test reagent"
      : testStage === 2
        ? selectedTest === "benedict" ? "Heating in a water bath" : "Colour change developing"
        : "Observation recorded";

  const currentMethodStep = testStage === 1 ? 0 : testStage === 2 ? 1 : testStage === 3 ? 2 : -1;
  const liquidStyle = { "--liquid-color": displayedColor } as CSSProperties;

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <BrandMark />
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#molecules" className="nav-active">Molecule atlas</a>
          <a href="#food-tests">Food tests</a>
          <a href="#fair-test">Fair testing</a>
        </nav>
        <a className="header-index" href="#food-tests">
          <span className="index-dot" />
          <span>LEARNING MODULE</span>
          <strong>01</strong>
        </a>
      </header>

      <main className="page-main">
        <section className="molecule-hero" id="molecules" aria-labelledby="page-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>THE CHEMISTRY OF LIFE</span>
              <span className="eyebrow-line" />
              <span>FIELD NOTES 01</span>
            </div>
            <h1 id="page-title">Biological<br /><em>molecules</em></h1>
            <p className="hero-deck">
              A hands-on guide to the small units, bonds and reactions that build living things.
            </p>

            <div className="selected-molecule" key={activeMolecule.id}>
              <div className="selection-meta">
                <span>IN THE VIEWER / {String(molecules.findIndex((item) => item.id === selectedMolecule) + 1).padStart(2, "0")}</span>
                <span className="selection-family">{activeMolecule.family}</span>
              </div>
              <div className="molecule-title-row">
                <h2>{activeMolecule.name}</h2>
                <span className="molecule-formula">{activeMolecule.formula}</span>
              </div>
              <p>{activeMolecule.summary}</p>
              <div className="molecule-facts">
                <div>
                  <span>TYPE</span>
                  <strong>{activeMolecule.classification}</strong>
                </div>
                <div>
                  <span>BUILDING BLOCK</span>
                  <strong>{activeMolecule.buildingBlock}</strong>
                </div>
              </div>
            </div>

            <a className="jump-link" href="#family-notes">
              <span>Explore the molecule families</span>
              <ArrowDownIcon />
            </a>
          </div>

          <div className="viewer-panel" aria-label="Interactive molecule viewer">
            <div className="viewer-topline">
              <div className="viewer-label">
                <span className="viewer-live-dot" />
                <span>MOLECULE STUDIO</span>
              </div>
              <div className="viewer-actions">
                <span className="drag-note">DRAG OR ARROWS / SCROLL OR +/- TO ZOOM</span>
                <button
                  className={`rotation-button ${rotationOn ? "is-on" : ""}`}
                  onClick={() => setRotationOn((current) => !current)}
                  aria-pressed={rotationOn}
                  title={rotationOn ? "Pause automatic rotation" : "Resume automatic rotation"}
                >
                  <span />{rotationOn ? "ROTATION ON" : "ROTATION OFF"}
                </button>
                <button
                  className="reset-button"
                  onClick={() => setResetVersion((current) => current + 1)}
                  aria-label="Reset molecule view"
                  title="Reset molecule view"
                >
                  <ResetIcon />
                </button>
              </div>
            </div>

            <div className="viewer-canvas-wrap">
              <div className="viewer-axis-label axis-x">x</div>
              <div className="viewer-axis-label axis-y">y</div>
              <MoleculeCanvas key={`${selectedMolecule}-${resetVersion}`} model={selectedMolecule} autoRotate={rotationOn} />
              <div className="canvas-caption">SCHEMATIC BALL-AND-STICK MODEL</div>
            </div>

            <div className="molecule-picker" aria-label="Choose a molecule">
              <div className="picker-label">SELECT A STRUCTURE</div>
              <div className="picker-options">
                {molecules.map((molecule, index) => (
                  <button
                    key={molecule.id}
                    className={selectedMolecule === molecule.id ? "is-selected" : ""}
                    onClick={() => setSelectedMolecule(molecule.id)}
                    aria-pressed={selectedMolecule === molecule.id}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {molecule.shortName}
                  </button>
                ))}
              </div>
            </div>

            <div className="viewer-legend" aria-label="Atom colour legend">
              <div className="atom-legend">
                <span><i className="atom-carbon">C</i>Carbon</span>
                <span><i className="atom-oxygen">O</i>Oxygen</span>
                <span><i className="atom-nitrogen">N</i>Nitrogen</span>
                <span><i className="atom-hydrogen">H</i>Hydrogen</span>
                <span><i className="atom-sulfur">S</i>Sulfur</span>
              </div>
              <span className="model-disclaimer">Simplified 3D view</span>
            </div>
          </div>
        </section>

        <section className="family-section" id="family-notes" aria-labelledby="family-heading">
          <div className="section-heading-row">
            <div>
              <div className="eyebrow dark-eyebrow">
                <span>01 / MOLECULE FAMILIES</span>
                <span className="eyebrow-line" />
                <span>STUDY NOTES</span>
              </div>
              <h2 id="family-heading">Same atoms.<br /><em>Different structures.</em></h2>
            </div>
            <p className="section-intro">
              Most biological molecules are organic: carbon-based compounds arranged in ways that give them different jobs.
            </p>
          </div>

          <div className="family-grid">
            <article className="family-column carbohydrate-column">
              <div className="family-topline"><span>01</span><span>CARBON / HYDROGEN / OXYGEN</span></div>
              <h3>Carbohydrates</h3>
              <p className="family-lead">Fast energy and structural material, from simple sugars to long chains.</p>
              <dl className="family-facts">
                <div><dt>Basic unit</dt><dd>Monosaccharide</dd></div>
                <div><dt>Long chains</dt><dd>Polysaccharides</dd></div>
                <div><dt>Examples</dt><dd>Starch, glycogen, cellulose</dd></div>
              </dl>
              <p className="family-note">
                The ending <strong>-ose</strong> commonly appears in sugar names. Simple sugars such as glucose are soluble; they diffuse from a region of higher concentration to lower concentration when a membrane lets them pass.
              </p>
              <div className="sugar-equations" aria-label="Examples of disaccharides">
                <div><span>Maltose</span><span>glucose + glucose</span></div>
                <div><span>Sucrose</span><span>glucose + fructose</span></div>
                <div><span>Lactose</span><span>glucose + galactose</span></div>
              </div>
              <div className="formula-note">
                <span>GLUCOSE FORMULA</span>
                <strong>C6H12O6 = C6(H2O)6</strong>
                <p>Many simple sugars have hydrogen and oxygen in a 2:1 ratio. "Hydrate of carbon" is a useful pattern, not a literal bond between carbon and water.</p>
              </div>
            </article>

            <article className="family-column lipid-column">
              <div className="family-topline"><span>02</span><span>CARBON / HYDROGEN / OXYGEN</span></div>
              <h3>Lipids</h3>
              <p className="family-lead">Energy stores and membranes, built from glycerol and fatty acids.</p>
              <dl className="family-facts">
                <div><dt>Basic parts</dt><dd>Glycerol + fatty acids</dd></div>
                <div><dt>Common fat</dt><dd>1 glycerol + 3 fatty acids</dd></div>
                <div><dt>Behaviour</dt><dd>Hydrophobic</dd></div>
              </dl>
              <p className="family-note">
                Oils do not mix with water: they are <strong>immiscible</strong>. In the emulsion test, lipid dissolves in ethanol first; adding water then makes a cloudy suspension.
              </p>
              <div className="solubility-compare">
                <div><span className="liquid-mark water-mark" /><span>Oil + water</span><strong>Separate layers</strong></div>
                <div><span className="liquid-mark ethanol-mark" /><span>Oil + ethanol</span><strong>Mix for the test</strong></div>
              </div>
              <div className="family-footnote">A triglyceride has three fatty-acid chains. Lipids are not usually described as repeating-monomer polymers.</div>
            </article>

            <article className="family-column protein-column">
              <div className="family-topline"><span>03</span><span>CARBON / HYDROGEN / OXYGEN / NITROGEN</span></div>
              <h3>Proteins</h3>
              <p className="family-lead">Working molecules whose shape comes from their amino-acid sequence.</p>
              <dl className="family-facts">
                <div><dt>Basic unit</dt><dd>Amino acid</dd></div>
                <div><dt>Bond</dt><dd>Peptide bond</dd></div>
                <div><dt>Polymer</dt><dd>Polypeptide chain</dd></div>
              </dl>
              <p className="family-note">
                Peptide bonds link amino acids into a polypeptide. The chain folds into a specific shape; a protein can contain one or more folded polypeptide chains.
              </p>
              <div className="chain-illustration" aria-label="Amino acids joined into a polypeptide chain">
                <span className="chain-node node-a">NH2</span>
                <span className="chain-bond" />
                <span className="chain-node node-b">C</span>
                <span className="chain-bond" />
                <span className="chain-node node-a">NH</span>
                <span className="chain-bond" />
                <span className="chain-node node-c">CO</span>
                <span className="chain-bond" />
                <span className="chain-node node-b">C</span>
              </div>
              <div className="chain-caption"><span>AMINO ACID</span><span>PEPTIDE BOND</span><span>POLYPEPTIDE</span></div>
            </article>
          </div>
        </section>

        <section className="test-section" id="food-tests" aria-labelledby="test-heading">
          <div className="lab-heading">
            <div>
              <div className="eyebrow dark-eyebrow">
                <span>02 / INVESTIGATE</span>
                <span className="eyebrow-line" />
                <span>FOOD TESTS</span>
              </div>
              <h2 id="test-heading">Look for a<br /><em>colour change.</em></h2>
            </div>
            <p className="section-intro">
              Choose a test and a sample, then run a qualitative simulation. The model shows the expected observation, not a measured concentration.
            </p>
          </div>

          <div className="lab-grid">
            <aside className="test-sidebar" aria-label="Choose a food test">
              <div className="sidebar-label">SELECT A TEST</div>
              <div className="test-list" role="tablist" aria-label="Food tests">
                {tests.map((test, index) => (
                  <button
                    className={`test-choice ${selectedTest === test.id ? "is-active" : ""}`}
                    key={test.id}
                    role="tab"
                    aria-selected={selectedTest === test.id}
                    onClick={() => setSelectedTest(test.id)}
                  >
                    <span className="test-number">0{index + 1}</span>
                    <span className="test-choice-copy"><strong>{test.name}</strong><small>Detects {test.shortTarget.toLowerCase()}</small></span>
                    <span className="test-chevron" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none"><path d="M4 12 12 4M5 4h7v7" /></svg>
                    </span>
                  </button>
                ))}
              </div>

              <div className="test-description" key={activeTest.id}>
                <span className="sidebar-label">WHAT IT SHOWS</span>
                <p>{activeTest.intro}</p>
                <div className="detect-label"><span>DETECTS</span><strong>{activeTest.shortTarget}</strong></div>
              </div>

              <div className="safety-note">
                <span className="safety-mark">!</span>
                <p><strong>Lab safety</strong>Wear eye protection. Ethanol is flammable; keep it away from flames. Heat Benedict's solution in a hot-water bath.</p>
              </div>
            </aside>

            <div className="bench-panel" role="tabpanel" aria-label={`${activeTest.name} simulation`}>
              <div className="bench-header">
                <div>
                  <span className="bench-kicker">VIRTUAL BENCH / {String(tests.findIndex((test) => test.id === selectedTest) + 1).padStart(2, "0")}</span>
                  <h3>{activeTest.name}</h3>
                </div>
                <label className="sample-select">
                  <span>FOOD SAMPLE</span>
                  <select value={selectedSample} onChange={(event) => setSelectedSample(event.target.value)}>
                    {samples.map((sample) => <option value={sample.id} key={sample.id}>{sample.name}</option>)}
                  </select>
                </label>
              </div>

              <div className="bench-content">
                <div className="procedure-panel">
                  <div className="procedure-label">PROCEDURE</div>
                  <ol className="procedure-list">
                    {activeTest.method.map((step, index) => (
                      <li className={`${currentMethodStep === index ? "step-current" : ""} ${testStage === 3 ? "step-done" : ""}`} key={step}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{step}</p>
                      </li>
                    ))}
                  </ol>
                  <button className="run-button" onClick={runTest} disabled={testStage === 1 || testStage === 2}>
                    <PlayIcon />
                    <span>{testStage === 1 || testStage === 2 ? "Running simulation" : "Run the test"}</span>
                  </button>
                  <p className="sim-note">A visual teaching model; real colour intensity depends on sample concentration.</p>
                  {selectedTest === "benedict" && (
                    <div className="benedict-scale" aria-label="Benedict's colour range as reducing sugar increases">
                      <span>MORE REDUCING SUGAR</span>
                      <div><i /><i /><i /><i /><b>INCREASING RESPONSE</b></div>
                    </div>
                  )}
                </div>

                <div className={`experiment-view ${selectedTest === "benedict" ? "has-water-bath" : ""}`} aria-live="polite">
                  <div className="experiment-status">
                    <span className={`status-indicator ${testStage === 3 ? "is-complete" : testStage > 0 ? "is-running" : ""}`} />
                    <span>{stageLabel}</span>
                    <span className="sample-tag">{activeSample.name}</span>
                  </div>
                  <div className={`experiment-scene ${testStage > 0 && testStage < 3 ? "scene-active" : ""}`}>
                    {selectedTest === "benedict" && (
                      <div className={`water-bath ${testStage >= 2 ? "bath-warming" : ""}`}>
                        <div className="bath-rim" />
                        <div className="bath-water" />
                        <span className="heat-wave wave-one" />
                        <span className="heat-wave wave-two" />
                        <span className="bath-mark">WARM WATER BATH</span>
                      </div>
                    )}
                    <div className="tube-rack rack-back"><span /><span /><span /></div>
                    <div className="test-tube" style={liquidStyle}>
                      <div className={`tube-fill ${selectedTest === "emulsion" && isPositive && testStage >= 2 ? "is-cloudy" : ""} ${testStage >= 2 && selectedTest === "benedict" && isPositive ? "is-heated" : ""}`} />
                      <div className="tube-meniscus" />
                      <div className="tube-glint" />
                      <div className="tube-rim" />
                      {testStage === 1 && <span className="reagent-drop" />}
                      {testStage >= 2 && selectedTest === "benedict" && isPositive && <span className="reaction-bubble bubble-one" />}
                      {testStage >= 2 && selectedTest === "benedict" && isPositive && <span className="reaction-bubble bubble-two" />}
                    </div>
                    <div className="tube-rack rack-front"><span /><span /><span /></div>
                    <div className="reagent-vial" aria-hidden="true">
                      <div className="vial-cap" />
                      <div className="vial-glass"><span style={{ backgroundColor: activeTest.startingColor }} /></div>
                      <small>REAGENT</small>
                    </div>
                    <span className="tube-label">{testStage === 3 ? "OBSERVED" : "SAMPLE + REAGENT"}</span>
                  </div>
                  <div className={`result-readout ${testStage === 3 ? "result-visible" : ""}`}>
                    <span className="result-swatch" style={{ backgroundColor: testStage === 3 ? displayedColor : "transparent" }} />
                    <span className="result-copy">
                      <small>{testStage === 3 ? (isPositive ? "POSITIVE RESULT" : "NEGATIVE RESULT") : "EXPECTED OBSERVATION"}</small>
                      <strong>{testStage === 3 ? resultText : `${activeTest.positiveOutcome.split(":")[0]} if ${activeTest.shortTarget.toLowerCase()} is present`}</strong>
                    </span>
                    {testStage !== 3 && <span className="result-wait">RUN TO OBSERVE</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sample-prep-note">
            <span className="prep-label">PREPARING A FOOD SAMPLE</span>
            <p>For a solid food, crush it, cover it with water and let it extract before testing the liquid. Use comparable amounts of sample and reagent in each trial.</p>
          </div>
        </section>

        <section className="fair-section" id="fair-test" aria-labelledby="fair-heading">
          <div className="fair-heading">
            <div>
              <div className="eyebrow dark-eyebrow">
                <span>03 / EXPERIMENT DESIGN</span>
                <span className="eyebrow-line" />
                <span>VALIDITY</span>
              </div>
              <h2 id="fair-heading">A fair test<br /><em>changes one thing.</em></h2>
            </div>
            <p className="section-intro">
              A valid comparison makes the independent variable the only planned difference. Keep the method consistent so the result is meaningful.
            </p>
          </div>

          <div className="variable-grid">
            <article className="variable-item independent-item">
              <span className="variable-number">01</span>
              <div className="variable-icon change-icon"><span /></div>
              <span className="variable-label">CHANGE</span>
              <h3>Independent variable</h3>
              <p>The factor you deliberately change, such as which food sample you test.</p>
            </article>
            <article className="variable-item dependent-item">
              <span className="variable-number">02</span>
              <div className="variable-icon measure-icon"><span /><span /></div>
              <span className="variable-label">OBSERVE</span>
              <h3>Dependent variable</h3>
              <p>The outcome you measure or observe, such as the final colour of the reagent.</p>
            </article>
            <article className="variable-item controlled-item">
              <span className="variable-number">03</span>
              <div className="variable-icon control-icon"><span /><span /><span /></div>
              <span className="variable-label">KEEP THE SAME</span>
              <h3>Controlled variables</h3>
              <p>Hold sample mass or volume, reagent volume, temperature, heating time and apparatus constant.</p>
            </article>
          </div>

          <div className="fair-example">
            <span className="example-marker">EXAMPLE</span>
            <p><strong>Comparing foods for starch:</strong> change the food sample, record the iodine colour, and keep the sample amount, iodine drops and observation time the same.</p>
            <span className="example-caution">If concentration is what you compare, concentration is the independent variable.</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <BrandMark />
        <span>MOLECULES / BONDS / EVIDENCE</span>
        <a href="#top">BACK TO THE TOP <ArrowDownIcon /></a>
      </footer>
    </div>
  );
}

export default App;