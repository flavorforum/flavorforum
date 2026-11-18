/*
  Flavor Forum: list of past talks.

  To add a talk, copy one block below, paste it at the top of the list,
  and change the fields. The newest talk goes first.

    id          short unique name, used in the link: talk.html?id=<id>
    date        YYYY-MM-DD
    time        as you want it shown, e.g. "7:00 PM IST"
    title       talk title (HTML allowed, e.g. B<sub>s</sub>, μ<sup>+</sup>)
    speaker     name
    affiliation position and place at the time of the talk
    bio         optional, short speaker bio (leave out if not available)
    paper       optional, { label: "arXiv:xxxx.xxxxx", url: "https://arxiv.org/abs/xxxx.xxxxx" }
    abstract    list of paragraphs (HTML allowed)

  Do not put meeting links or passcodes here. This file is public.
*/

window.TALKS = [
  {
    id: "2026-05-rajeev",
    date: "2026-05-30",
    time: "7:00 PM IST",
    title: "Neutrino mass variables in 3 active and 2 sterile neutrino scenario",
    speaker: "N. Rajeev",
    affiliation: "Postdoctoral Fellow, JINR Dubna",
    abstract: [
      "The three-flavor neutrino oscillation framework explains most experiments but faces anomalies suggesting additional sterile states: eV-scale from LSND/MiniBooNE and sub-eV from T2K–NOνA tension/solar upturn absence. These Standard Model singlets mix via active neutrinos. We study 3+2 phenomenology (one eV-scale + one sub-eV sterile), its effects on absolute-mass observables (cosmological sum, beta-decay effective mass, 0νββ Majorana mass), and find it alters allowed parameter space vs. 3ν/3+1 cases, disfavoring some mass orderings per current limits. Upcoming KATRIN/Project 8/nEXO sensitivities will probe this via complementary sub-eV roles beyond 3ν."
    ]
  },
  {
    id: "2025-11-vinze",
    date: "2025-11-28",
    time: "9:30 PM IST",
    title: "Helicity amplitude for the process q q̄ → q q̄ g",
    speaker: "Radhika Vinze",
    affiliation: "Postdoctoral Fellow, IISER Mohali",
    abstract: [
      "Precision calculations in hadronic processes at high energy colliders are crucial for improving the understanding of the standard phenomena as well as for the discovery of new physics. Spinor-helicity formalism serves as one of the most efficient ways to simplify the calculations of S matrix elements. In this article, we compute the S matrix elements for the process q q̄ → q q̄ g mediated by photon and gluon. Ignoring the contribution of Z boson exchange, we show that the calculation of S matrix elements for this process simplifies to a great extent by using spinor-helicity formalism."
    ]
  },
  {
    id: "2025-11-boora",
    date: "2025-11-12",
    time: "9:00 PM IST",
    title: "A comprehensive study of Λ<sub>c</sub><sup>−</sup> → Λ(→ pπ) μ<sup>−</sup> ν̄<sub>μ</sub> incorporating SMEFT implications and right-handed neutrino",
    speaker: "Priyanka Boora",
    affiliation: "PhD scholar, MNIT Jaipur",
    bio: "Priyanka Boora is a PhD student at Malaviya National Institute of Technology (MNIT), Jaipur. Her research focuses on new physics effects in semileptonic charm decays, such as those of B<sub>c</sub> and Λ<sub>c</sub>, in the EFT and SMEFT framework. Her work includes searches for new physics effects involving right-handed neutrinos in processes like B<sub>c</sub><sup>+</sup> → B<sub>s</sub> μ<sup>+</sup> ν<sub>μ</sub>. She is also a member of the Electron-Ion Collider (EIC) collaboration and has contributed to the EIC Yellow Report on science requirements and detector concepts.",
    paper: { label: "arXiv:2510.05050", url: "https://arxiv.org/abs/2510.05050" },
    abstract: [
      "We present a comprehensive analysis of the decay Λ<sub>c</sub><sup>−</sup> → Λ(→ pπ) μ<sup>−</sup> ν̄<sub>μ</sub> within a model-independent effective field theory framework. Previous studies have been restricted to the three-body decay Λ<sub>c</sub><sup>+</sup> → Λ μ<sup>+</sup> ν<sub>μ</sub> and considered only left-handed neutrinos within the Low-Energy Effective Theory (LEFT). In this work, we extend the analysis to the complete four-body angular distribution for the first time, incorporating the indirect constraints implied by the Standard Model Effective Field Theory (SMEFT) on the LEFT Wilson coefficients. We also include the effects of right-handed neutrino (RHN) operators, enabling a unified treatment of both left- and right-handed neutrino interactions in the c → s μ ν<sub>μ</sub> transition.",
      "Using the global bounds derived from LEFT observables and their SMEFT correlations, we study the impact of allowed new-physics scenarios on a variety of observables, including differential decay rates, forward–backward asymmetries, polarization asymmetries of the final-state hadron and lepton, and the angular coefficients (M<sub>0</sub> to M<sub>9</sub>) in the four-body angular distribution. Our analysis reveals significant deviations from the Standard Model in the observables P<sub>L</sub><sup>Λ</sup> and M<sub>1</sub> for C<sub>V</sub><sup>RL</sup> and C<sub>V</sub><sup>RR</sup>, and striking T-odd effects in M<sub>7</sub> for complex C<sub>V</sub><sup>RL</sup>. These features provide sensitive probes of vector-type new physics, such as leptoquark or right-handed current models. The predicted patterns can be tested in forthcoming measurements at BESIII, LHCb, and Belle II, where polarization-sensitive observables in Λ<sub>c</sub> decays are becoming experimentally accessible."
    ]
  },
  {
    id: "2025-07-sahdev",
    date: "2025-07-18",
    time: "7:00 PM IST",
    title: "Signatures of Multicharged Exotic Particles at the Collider Experiments",
    speaker: "Vandana Sahdev",
    affiliation: "PhD scholar, University of Delhi",
    bio: "Vandana Sahdev is a PhD student at Delhi University. Her research work focuses on physics beyond the Standard Model, exploring novel signatures of dark matter, neutrino masses, and precision anomalies. She investigates exotic decays of pNGB scalars in composite Higgs models, collider signatures of fermionic multiplets, and scalar extensions that explain the XENON1T excess and muon (g − 2) anomaly. Her research aims to connect theoretical models with testable predictions at current and future experiments.",
    abstract: [
      "Beyond the Standard Model theories predict several kinds of exotic particles that are being extensively searched for at the Large Hadron Collider. These include multicharged scalars and fermions which will be probed with unprecedented sensitivity at the upcoming collider facilities offering higher luminosities and center-of-mass energies, such as the HL-LHC, FCC-hh, and future lepton colliders. In this talk, we explore the collider prospects of a few such SU(2) multiplets arising in different models. We begin with a study of quintuplet Majorana fermions, motivated primarily to address the issue of neutrino masses. The quintuplets decay via lighter scalar multiplets leading to non-standard final states at the LHC and future linear colliders. Finally, we discuss briefly the decay modes of pNGB scalars within the SU(5)/SO(5) Composite Higgs Model and their production at the LHC and future muon collider."
    ]
  },
  {
    id: "2025-06-vardani",
    date: "2025-06-16",
    time: "7:00 PM IST",
    title: "Lepton Flavour Violating B → K<sub>2</sub><sup>*</sup> μ<sup>±</sup> τ<sup>∓</sup> Decays",
    speaker: "Juhi Vardani",
    affiliation: "PhD scholar, IIT Jodhpur",
    bio: "Juhi Vardani is a PhD student at IIT Jodhpur. Her research explores physics beyond the Standard Model, with a focus on B anomalies, lepton flavor violation, lepton universality violation, and quantum coherence in neutrino experiments. Her work includes studies of Leggett-Garg-type inequalities in NOνA and T2K, rare semileptonic B → K<sub>2</sub><sup>*</sup>(1430) μ<sup>+</sup> μ<sup>−</sup> decays, and the role of vector leptoquark models in lepton flavor violating processes.",
    abstract: [
      "The measurements on lepton flavor universality violation in semileptonic b → s and b → c transitions hints towards a possible role of new physics in both sectors. Motivated by these anomalies, we investigate the lepton flavor violating B → K<sub>2</sub><sup>*</sup>(1430) μ<sup>±</sup> τ<sup>∓</sup> decays. We calculate the two-fold angular distribution of B → K<sub>2</sub><sup>*</sup>(1430) ℓ<sub>1</sub> ℓ<sub>2</sub> decay in presence of vector, axialvector, scalar and pseudo-scalar new physics interactions. Later, we compute the branching fraction and lepton forward-backward asymmetry in the framework of U<sub>1</sub> vector leptoquark which is a viable solution to the B anomalies. We find that the upper limits are ℬ(B → K<sub>2</sub><sup>*</sup> μ<sup>−</sup> τ<sup>+</sup>) ≤ 1.64 × 10<sup>−7</sup> and ℬ(B → K<sub>2</sub><sup>*</sup> μ<sup>+</sup> τ<sup>−</sup>) ≤ 0.60 × 10<sup>−7</sup> at 90% C.L."
    ]
  },
  {
    id: "2025-05-boora",
    date: "2025-05-15",
    time: "9:00 PM IST",
    title: "New Physics Effects with Right-Handed Neutrinos in Semileptonic Decay B<sub>c</sub><sup>+</sup> → B<sub>s</sub> μ<sup>+</sup> ν<sub>μ</sub>",
    speaker: "Priyanka Boora",
    affiliation: "PhD scholar, MNIT Jaipur",
    bio: "Priyanka Boora is a PhD student at Malaviya National Institute of Technology (MNIT), Jaipur. Her research focuses on new physics effects in semileptonic charm decays, such as those of B<sub>c</sub> and Λ<sub>c</sub>, in the EFT and SMEFT framework. Her work includes searches for new physics effects involving right-handed neutrinos in processes like B<sub>c</sub><sup>+</sup> → B<sub>s</sub> μ<sup>+</sup> ν<sub>μ</sub>. She is also a member of the Electron-Ion Collider (EIC) collaboration and has contributed to the EIC Yellow Report on science requirements and detector concepts.",
    abstract: [
      "We extend the Standard Model with a general effective Hamiltonian for the quark-level transition c → s ℓ ν, including a complete set of four-fermion operators with right-handed neutrinos. Current experimental measurements in charm decays are consistent with Standard Model predictions and are used to constrain possible new physics. Using the available data, we perform a chi-squared (χ<sup>2</sup>) fit to determine the best-fit values of the new physics Wilson coefficients. We study the impact of these allowed new physics scenarios on observables such as the differential branching fraction, forward-backward asymmetry, lepton polarization asymmetry, and convexity parameter in the semileptonic decay B<sub>c</sub><sup>+</sup> → B<sub>s</sub> μ<sup>+</sup> ν<sub>μ</sub>. These new physics scenarios can significantly modify these observables. Future experimental measurements will be crucial for disentangling the underlying structure of possible new physics."
    ]
  },
  {
    id: "2025-03-kolay",
    date: "2025-03-15",
    time: "7:00 PM IST",
    title: "The Role of Flavour Constraints in Simplified Models of Fermionic Dark Matter",
    speaker: "Lipika Kolay",
    affiliation: "PhD scholar, IIT Guwahati",
    abstract: [
      "In data-driven analyses, simplified models provide a solid framework without forcing us into the complexities of a UV-complete model. We analyse a simplified DM scenario with a spin-0 mediator and fermionic DM, considering both low-mass (&lt;10 GeV) and intermediate-mass (100–1000 GeV) regions. Our analysis considers a wide range of observables, including flavour-changing charged and neutral current processes from neutral meson mixing, leptonic and semi-leptonic meson decays, differential decay widths, LFUV observables, and fixed-target experiments, along with electroweak precision data such as W/Z-pole observables. Additionally, DM relic density, direct and indirect detection constraints are incorporated to further constrain the dark sector parameters. We analyse correlations among couplings and masses, providing insights into viable parameter spaces and the role of higher-dimensional operators in SDM phenomenology."
    ]
  },
  {
    id: "2025-02-karmakar",
    date: "2025-02-15",
    time: "6:00 PM IST",
    title: "SMEFT predictions and beyond for semileptonic processes",
    speaker: "Siddhartha Karmakar",
    affiliation: "PhD scholar, TIFR Mumbai",
    bio: "Siddhartha Karmakar is a PhD student at TIFR Mumbai. His research interests are broadly in particle physics phenomenology, particularly flavor physics and effective field theories.",
    abstract: [
      "The SU(2)<sub>L</sub> × U(1)<sub>Y</sub> invariance of the Standard Model Effective Field Theory (SMEFT) predicts multiple restrictions in the space of Wilson coefficients of U(1)<sub>em</sub> invariant effective Lagrangians such as the Low-energy Effective Field Theory (LEFT), used for low-energy flavor-physics observables, or the Higgs Effective Field Theory (HEFT) in unitary gauge, appropriate for weak-scale observables. In this work, we derive and enumerate all such predictions for semileptonic operators up to dimension 6. We find that these predictions can be expressed as 2223 linear relations among the HEFT/LEFT Wilson coefficients, that are completely independent of any assumptions about the alignment of the mass and flavor bases. These relations interconnect a wide array of experimental searches, including high-p<sub>T</sub> dilepton searches, top decays, Z-pole observables, charged lepton flavor violating observables, non-standard neutrino interaction searches and semileptonic decays of B, K and D mesons. We illustrate how these relations can be utilized to impose stringent indirect constraints on several Wilson coefficients that are currently weakly constrained or entirely unconstrained by direct experiments. Moreover, these relations imply that any evidence of new physics in a specific search channel must generally be accompanied by correlated anomalies in other channels. We further explore the possibility of identifying violations of these relations by examining flavor physics observables. We analyze the angular distributions of baryonic and mesonic decays and propose observables that are suitable for distinguishing effects beyond SMEFT from other new-physics scenarios within SMEFT."
    ]
  },
  {
    id: "2025-01-patnaik",
    date: "2025-01-15",
    time: "6:00 PM IST",
    title: "Study of Semileptonic and Radiative Decays of Heavy Mesons in a Potential Model Framework",
    speaker: "Sonali Patnaik",
    affiliation: "Postdoctoral Fellow, NISER Bhubaneswar",
    abstract: [
      "We perform an analysis of electromagnetic and semileptonic decay modes of B<sub>c</sub> mesons using a QCD-inspired phenomenological model. In light of recent observations of anomalies at the LHC involving the R-ratios, tau-polarization (P<sub>τ</sub>), and forward-backward asymmetry (A<sub>FB</sub>), which are particularly sensitive to New Physics, we investigate observables for the decay channels: B<sub>c</sub> → η<sub>c</sub>(J/ψ) τ ν<sub>τ</sub> and B<sub>c</sub> → D(D<sup>*</sup>) τ ν<sub>τ</sub> within a potential model framework.",
      "We also study electromagnetic channels such as: B<sub>c</sub><sup>*</sup> → B<sub>c</sub> γ and B<sub>c</sub><sup>*</sup> → B<sub>c</sub> e<sup>+</sup>e<sup>−</sup>. For the typical case of B<sub>c</sub><sup>*</sup>(1S) → B<sub>c</sub>(1S) γ, our predicted decay width is found to be quite sensitive to the mass difference between B<sub>c</sub><sup>*</sup> and B<sub>c</sub> mesons, which may help to determine the mass of B<sub>c</sub><sup>*</sup> experimentally.",
      "Additionally, we calculate the vector, pseudo-scalar, and electromagnetic form factors, examining their q<sup>2</sup> dependence for these transitions in both ground and radially excited states. Given the fluctuating appearance and disappearance of flavor anomalies in the Run 3 data collection period, this study seeks to identify different measurement tools capable of probing small regions of theoretical parameter space."
    ]
  },
  {
    id: "2024-12-rajeev",
    date: "2024-12-15",
    time: "7:00 PM IST",
    title: "SMEFT Analysis of Charged Lepton Flavor Violating B-Meson Decays",
    speaker: "N. Rajeev",
    affiliation: "Postdoctoral Fellow, PRL Ahmedabad",
    abstract: [
      "Charged lepton flavor violation (cLFV) processes, potentially important for various Beyond the Standard Model Physics scenarios, are analyzed in the Standard Model Effective Field Theory (SMEFT) framework. We consider the most relevant 2 quark-2 lepton (2q2ℓ) operators for the leptonic and semi-leptonic LFV B-decay (LFVBD) processes B<sub>s</sub> → μ<sup>+</sup>e<sup>−</sup>, B<sup>+</sup> → K<sup>+</sup>μ<sup>+</sup>e<sup>−</sup>, B<sup>0</sup> → K<sup>*0</sup>μ<sup>+</sup>e<sup>−</sup>, and B<sub>s</sub> → ϕμ<sup>−</sup>e<sup>+</sup>. We analyze the interplay among the Wilson coefficients responsible for these LFVBDs and other cLFV processes like CR(μ → e), ℓ<sub>i</sub> → ℓ<sub>j</sub>γ, ℓ<sub>i</sub> → ℓ<sub>j</sub>ℓ<sub>k</sub>ℓ<sub>m</sub>, and Z → ℓ<sub>i</sub>ℓ<sub>j</sub>, to find the maximal possible LFV effects in B-meson decays. We probe the scale of new physics in relation to the constraints imposed by both classes of LFV decays while considering both the present bounds and future expectations. In view of the proposed experiments at LHCb-II and Belle II to study charged LFV processes, we have also provided the upper limits on the indirect constraints on such LFVBDs. For the processes where the B meson decays to μ<sup>+</sup> and e<sup>−</sup>, we show that new physics can be constrained by an enhancement of 2-4 orders of magnitude on the current sensitivities of the BRs of B<sup>+</sup> → K<sup>+</sup>μ<sup>+</sup>e<sup>−</sup>, B<sup>0</sup> → K<sup>*0</sup>μ<sup>+</sup>e<sup>−</sup>, and B<sub>s</sub> → ϕμ<sup>+</sup>e<sup>−</sup>."
    ]
  }
];
