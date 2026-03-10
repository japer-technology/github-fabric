folder
.github-mimic

title
.github-mimic: repo-local intelligence that infers repository intent and compiles LLM-driven command systems through multiple operational lenses

abstract
This paper proposes .github-mimic, a repo-local intelligence package installable by adding a single folder to a GitHub repository. The package observes repository artifacts (code, configuration, CI workflows, issues, pull requests, conventions) to infer “what is going on,” then compiles an explicit command system that mimics the repository’s functionality through multiple lenses (developer, maintainer, security, operations, documentation, product). Unlike fixed orchestration frameworks, .github-mimic treats external methodologies as textual process descriptions that can be transformed into executable, repo-native commands. The system is designed for high-latency, high-value invocation via GitHub Issues and Actions, emphasizing auditability, redundancy, and governance.

keywords
repo-local intelligence; LLM command compilation; GitHub Actions; issue-driven UX; lenses; process portability; governance; redundancy checks

1. introduction
   Repositories encode both software and the operational knowledge required to change it safely. In practice, this knowledge is fragmented across scripts, CI configuration, conventions, and historical discussions. Conventional assistants are typically external to the repository’s governance surface and do not naturally produce auditable, versioned artifacts. Meanwhile, GitHub Actions provides a ubiquitous execution substrate but operates with non-trivial latency and cost per run, pushing interaction design toward fewer, more deliberate invocations.

This paper introduces .github-mimic as a pattern and packaging strategy: a repo-local intelligence that (a) infers how a repository actually works and (b) compiles that understanding into an explicit, versioned command surface that can be invoked through issues.

2. concept overview
   2.1 repo-local intelligence package
   A directory dropped into the repository that includes:

* workflows to trigger execution (issue/label/comment driven)
* a policy layer (permissions, allowlists, risk gates)
* a knowledge layer (repo state summaries, extracted conventions, command specs)
* an execution layer (planning, verification, PR creation, reporting)

2.2 command system synthesis (LLM as command compiler)
Instead of responding conversationally, the LLM produces:

* command specs (what exists, what inputs it needs, what it is allowed to touch)
* executable plans (steps, checks, outputs)
* evidence bundles (logs, diffs, test results)
* durable artifacts (PRs, reports, updated specs)

2.3 lenses
A lens is an operating mode that changes:

* which signals are prioritized
* what outputs are produced
* what safety gates apply
* what “success” means

Example lenses: developer, maintainer, security, operations, documentation, product.

3. architecture
   3.1 observation layer (inferring what is going on)
   Signals include:

* build/test/lint scripts and task runners
* CI workflows and job graphs
* dependency manifests and update patterns
* release tags, changelogs, versioning conventions
* contribution and triage conventions (templates, labels, ownership hints)
* PR history patterns (common files changed, recurring failures)

3.2 model layer (repo state representation)
The system maintains a small set of versioned, human-readable artifacts, such as:

* repo-profile.json (purpose, stacks, constraints, invariants)
* commands/ (generated command specs)
* lenses/ (lens policies and guardrails)
* memory/ (summaries of decisions, do/don’t lists, known pitfalls)

3.3 compilation layer (from intent to execution)
Given an issue request, .github-mimic:

* resolves the requested lens and command
* creates a plan with explicit steps and checkpoints
* runs deterministic checks first (existing scripts, static analysis)
* proposes changes via PR (not direct pushes)
* attaches evidence and a rollback story for risky operations

4. process portability: importing behavior as text, not libraries
   4.1 claim
   Many coordination and orchestration approaches can be imported as textual process descriptions (rules, constraints, control loops), then compiled into repo-native commands, rather than embedding heavyweight orchestration libraries.

4.2 mechanism

* capture the process description (algorithm narrative, policies, role definitions)
* convert it into a command spec with explicit inputs, checks, and outputs
* enforce redundancy and validation on high-impact steps
* keep the process description versioned and reviewable

4.3 benefit

* smaller dependency surface
* less lock-in to a framework’s runtime model
* “how the system behaves” becomes a first-class, auditable artifact

5. reliability design: multiplexed decision trees and redundancy
   5.1 multiplexed questioning
   For risky actions, the system re-derives key facts multiple ways:

* restatements and constraint extraction
* invariant checks (“what must not change”)
* adversarial failure search (“how could this break”)
* optional cross-model or cross-sample agreement (configurable)

5.2 two-phase commit behavior

* phase 1: propose (plan + PR + evidence)
* phase 2: verify (CI + explicit approvals + policy checks)
* apply only after gates pass

5.3 evidence-first standard
No “trust me” changes: every claim is paired with logs, diffs, or checks.

6. governance and security
   6.1 threat model (high-level)
   assets: repository integrity, secrets, release artifacts, workflow permissions, supply chain trust
   attack surfaces: prompt injection via issues, malicious PR content, dependency scripts, workflow token overreach, exfiltration via logs/artifacts
   risks: unauthorized code changes, secret leakage, destructive automation, dependency compromise

6.2 mitigations

* least-privilege GITHUB_TOKEN permissions
* explicit allowlists of modifiable paths and file types
* mandatory PR-based changes with branch protections
* no secret material in model prompts by default; use OIDC/ephemeral credentials where possible
* sandboxing and job isolation for untrusted code paths
* policy-enforced risk tiers (low/medium/high) with required human approvals

7. evaluation plan

* correctness of inferred repo mechanics (build/test/release understanding)
* stability of generated command surface over time
* time-to-value in a new repo (how many invocations to become useful)
* safety outcomes (rate of risky proposals caught by gates)
* maintainability (humans can edit specs/policies effectively)
* interoperability (integration via auditable connectors and controlled tool calls)

8. limitations

* high-latency interaction makes it unsuitable for rapid back-and-forth debugging loops
* ambiguous repo intent may require early “profiling runs” and human correction
* truly external actions (device-local operations, private environments) require handoff or separate runtime boundaries
* quality depends on the strength of verification gates and the clarity of repo invariants

9. conclusion
   .github-mimic is a pattern for embedding intelligence inside repositories where it can infer operational reality and compile that understanding into a versioned command system. By treating orchestration methods as importable text processes and by enforcing redundancy, evidence, and governance, the approach aims to make high-value, repo-native intelligence practical under GitHub Actions constraints.

appendix A: definitions (suggested)

* command surface: the explicit set of invocable operations and their specs
* lens: a policy + objective bundle that changes how the repo is interpreted and acted upon
* process portability: importing coordination behavior as text compiled into commands
* multiplexed decision tree: redundant question/answer derivations used as reliability gates

README/proposal doc you can drop into a repo (README.md)

name
.github-mimic

purpose
Drop-in repo-local intelligence that:

1. infers what this repository is, how it works, and what “safe change” means here
2. generates an LLM-driven command system that mirrors existing repo workflows
3. executes requests through issues/actions and returns durable artifacts (PRs, reports, evidence)
4. supports multiple lenses (developer, maintainer, security, ops, docs, product) with different guardrails

installation

* copy the .github-mimic folder into the repository root
* commit to the default branch
* ensure branch protections require PRs for changes

how to use (issue UX)
Create an issue with one of these patterns:

* /mimic status
* /mimic profile
* /mimic lens docs: sync and update reference docs for recent changes
* /mimic lens security: review workflow token permissions and propose least-privilege PR
* /mimic command list
* /mimic run <command-name> with <inputs>

Recommended: apply label mimic/run to trigger execution.

folder layout (suggested)
.github-mimic/

* workflows/

  * mimic.yml (issue/label trigger, runs the agent, posts results, opens PRs)
* config/

  * mimic.yaml (policy, lenses, providers, risk gates)
* commands/

  * generated command specs live here (versioned)
* lenses/

  * lens policies and templates
* memory/

  * repo profile + summaries (versioned, human-editable)
* runtime/

  * prompts, templates, tool adapters

configuration (config/mimic.yaml)

```yaml
providers:
  default: openai
  allow_local: true

execution:
  pr_only: true
  max_files_changed: 50
  allow_paths:
    - "src/**"
    - "docs/**"
    - ".github/**"
  deny_paths:
    - ".github-mimic/secrets/**"

governance:
  risk_tiers:
    low:
      requires_approval: false
    medium:
      requires_approval: true
      approvers: ["CODEOWNERS"]
    high:
      requires_approval: true
      approvers: ["CODEOWNERS", "SECURITY_TEAM"]

lenses:
  developer:
    default_risk: low
  docs:
    default_risk: low
  maintainer:
    default_risk: medium
  security:
    default_risk: high
  ops:
    default_risk: medium
  product:
    default_risk: low
```

command spec format (commands/*.yaml)

```yaml
name: docs.sync
lens: docs
intent: "Synchronize documentation with current code and recent PR changes."
inputs:
  - name: scope
    type: string
    default: "docs/**"
constraints:
  - "Do not change code under src/ unless explicitly requested."
  - "All changes must be in a PR."
verification:
  - "Link to evidence: file diffs + doc build/test if available."
outputs:
  - type: pull_request
risk: low
plan_template:
  - "Summarize current docs structure and identify drift."
  - "Extract public APIs/behaviors from code and tests."
  - "Update docs with minimal diffs."
  - "Run doc checks (if configured)."
  - "Open PR with summary + evidence."
```

multiplexed reliability gates (high level)
For medium/high risk commands, .github-mimic should:

* re-derive requirements and invariants in at least 2 passes
* generate an explicit “what could go wrong” section
* propose a rollback story
* require approvals per risk tier before applying

workflow trigger skeleton (.github-mimic/workflows/mimic.yml)

```yaml
name: mimic
on:
  issues:
    types: [opened, labeled, edited]
permissions:
  contents: read
  pull-requests: write
  issues: write

concurrency:
  group: mimic-${{ github.event.issue.number }}
  cancel-in-progress: false

jobs:
  run:
    if: contains(github.event.issue.labels.*.name, 'mimic/run')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run mimic
        run: |
          echo "Invoke repo-local intelligence here"
          # 1) read issue text
          # 2) select lens/command
          # 3) run checks
          # 4) produce PR + evidence
```

operating principles

* default to proposing PRs, never pushing directly
* every action produces evidence (logs, diffs, check outputs)
* lens selection is explicit and recorded
* policy and command specs are versioned so behavior is reviewable
* external “methods” can be imported as text processes and compiled into commands

next step options (pick one and I’ll generate it fully)

1. a concrete “repo profiling run” spec (what files to read, what summary artifacts to write)
2. a complete mimic.yml workflow wired to issue commands + label triggers
3. 10 starter commands (build/test/lint/docs/security/triage/release-plan) as YAML specs
