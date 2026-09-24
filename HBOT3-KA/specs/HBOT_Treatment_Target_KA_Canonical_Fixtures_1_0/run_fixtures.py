#!/usr/bin/env python3
import json, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent
SUITE=json.loads((ROOT/"canonical-fixtures.json").read_text())
ROLES=["DEP-WAGNER","DEP-HBOT-DECISION","DEP-BURDEN","DEP-MARGOLIS"]
MATRIX={
("VERY_UNFAVORABLE_PROGNOSIS_BAND","LOWER_BURDEN_BAND"):("SYN-VU-L-01","ON_TARGET"),("VERY_UNFAVORABLE_PROGNOSIS_BAND","MIDDLE_BURDEN_BAND"):("SYN-VU-M-02","ON_TARGET"),("VERY_UNFAVORABLE_PROGNOSIS_BAND","HIGHER_BURDEN_BAND"):("SYN-VU-H-03","NEAR_TARGET"),
("UNFAVORABLE_PROGNOSIS_BAND","LOWER_BURDEN_BAND"):("SYN-U-L-04","ON_TARGET"),("UNFAVORABLE_PROGNOSIS_BAND","MIDDLE_BURDEN_BAND"):("SYN-U-M-05","NEAR_TARGET"),("UNFAVORABLE_PROGNOSIS_BAND","HIGHER_BURDEN_BAND"):("SYN-U-H-06","NEAR_TARGET"),
("INTERMEDIATE_PROGNOSIS_BAND","LOWER_BURDEN_BAND"):("SYN-I-L-07","NEAR_TARGET"),("INTERMEDIATE_PROGNOSIS_BAND","MIDDLE_BURDEN_BAND"):("SYN-I-M-08","NEAR_TARGET"),("INTERMEDIATE_PROGNOSIS_BAND","HIGHER_BURDEN_BAND"):("SYN-I-H-09","OUTER_TARGET"),
("RELATIVELY_FAVORABLE_PROGNOSIS_BAND","LOWER_BURDEN_BAND"):("SYN-RF-L-10","NEAR_TARGET"),("RELATIVELY_FAVORABLE_PROGNOSIS_BAND","MIDDLE_BURDEN_BAND"):("SYN-RF-M-11","OUTER_TARGET"),("RELATIVELY_FAVORABLE_PROGNOSIS_BAND","HIGHER_BURDEN_BAND"):("SYN-RF-H-12","OUTER_TARGET")}
GATES={"OUTPUT-01":"NOT_SUPPORTED","OUTPUT-02":"SUPPORTED","OUTPUT-03":"SUPPORTED","OUTPUT-04":"INSUFFICIENT_DECISION","OUT-OF-SCOPE":"OUT_OF_SCOPE"}
PRECEDENCE=[("input_validation","KA-ERR-INPUT-VALIDATION"),("identity_mismatch","KA-ERR-DEPENDENCY-IDENTITY"),("version_mismatch","KA-ERR-DEPENDENCY-VERSION"),("dependency_unavailable","KA-ERR-DEPENDENCY-UNAVAILABLE"),("invocation_failure","KA-ERR-INVOCATION"),("native_failure","KA-ERR-CONSTITUENT-RESULT"),("output_contract","KA-ERR-OUTPUT-CONTRACT"),("subject_incoherence","KA-ERR-SUBJECT-COHERENCE"),("temporal_incoherence","KA-ERR-TEMPORAL-COHERENCE"),("provenance_failure","KA-ERR-PROVENANCE"),("transformation_failure","KA-ERR-TRANSFORMATION"),("cached_engagement","KA-ERR-JOIN-INCOMPLETE"),("join_incomplete","KA-ERR-JOIN-INCOMPLETE"),("result_construction","KA-ERR-RESULT-CONSTRUCTION")]

def validate_suite(s):
    assert set(s)=={"suite_id","suite_version","cks_status","cks_version_iri","fixtures"}
    assert s["suite_id"]=="HBOT-TREATMENT-TARGET-KA-CANONICAL-FIXTURES" and s["suite_version"]=="1.0" and s["cks_status"]=="CKS Version 1.0"
    assert s["cks_version_iri"]=="https://kgrid.org/cks/hbot-treatment-target-ka/versions/cks-1.0"
    ids=[]
    for f in s["fixtures"]:
        assert set(f)=={"fixture_id","category","polarity","cks_requirements","given","expect"}
        assert f["polarity"] in {"positive","negative"} and f["cks_requirements"]
        assert set(f["expect"])=={"status","target_classification","reason_code","gate_result","synthesis_rule_id","completed_classification_permitted","diagnostics_include"}
        ids.append(f["fixture_id"])
    assert len(ids)==len(set(ids))
validate_suite(SUITE)

def evaluate(g):
    conditions={c["code"] for c in g.get("injected_conditions",[])}
    for code,reason in PRECEDENCE:
        if code in conditions:
            return ("indeterminate","INDETERMINATE",reason,"NOT_EVALUABLE",None)
    records=g["dependency_engagements"]
    if [r["role"] for r in records] != ROLES or any(r["state"]!="completed_valid" or r["engagement_mode"]!="fresh_invocation" or r["validation_status"]!="valid" for r in records):
        return ("indeterminate","INDETERMINATE","KA-ERR-JOIN-INCOMPLETE","NOT_EVALUABLE",None)
    native=g["hbot_native_result"]; gate=GATES.get(native)
    if gate is None: return ("indeterminate","INDETERMINATE","KA-ERR-GATE-UNDEFINED","NOT_EVALUABLE",None)
    if gate=="NOT_SUPPORTED": return ("completed","OFF_TARGET","KA-RESULT-HBOT-NOT-SUPPORTED",gate,None)
    if gate=="INSUFFICIENT_DECISION": return ("indeterminate","INDETERMINATE","KA-INDET-HBOT-INSUFFICIENT-DECISION",gate,None)
    if gate=="OUT_OF_SCOPE": return ("indeterminate","INDETERMINATE","KA-INDET-HBOT-OUT-OF-SCOPE",gate,None)
    special={"synthesis_unknown_projection":"KA-ERR-SYNTHESIS-UNKNOWN-PROJECTION","synthesis_nonconforming":"KA-ERR-SYNTHESIS-COMBINATION-NONCONFORMING","synthesis_undefined":"KA-ERR-SYNTHESIS-COMBINATION-UNDEFINED","synthesis_disputed":"KA-ERR-SYNTHESIS-COMBINATION-DISPUTED"}
    for code,reason in special.items():
        if code in conditions: return ("indeterminate","INDETERMINATE",reason,"SUPPORTED",None)
    hit=MATRIX.get((g.get("prognosis_projection"),g.get("burden_projection")))
    if not hit: return ("indeterminate","INDETERMINATE","KA-ERR-SYNTHESIS-COMBINATION-UNDEFINED","SUPPORTED",None)
    return ("completed",hit[1],"KA-RESULT-SUPPORTED-SYNTHESIS","SUPPORTED",hit[0])

results=[]
for f in SUITE["fixtures"]:
    actual=evaluate(f["given"]); e=f["expect"]
    wanted=(e["status"],e["target_classification"],e["reason_code"],e["gate_result"],e["synthesis_rule_id"])
    passed=actual==wanted and e["completed_classification_permitted"]==(actual[0]=="completed")
    results.append({"fixture_id":f["fixture_id"],"passed":passed,"expected":wanted,"actual":actual})
report={"suite_id":SUITE["suite_id"],"suite_version":SUITE["suite_version"],"total":len(results),"passed":sum(r["passed"] for r in results),"failed":sum(not r["passed"] for r in results),"results":results}
(ROOT/"TEST_REPORT.json").write_text(json.dumps(report,indent=2)+"\n")
print(f'{report["passed"]}/{report["total"]} fixtures passed')
sys.exit(1 if report["failed"] else 0)
