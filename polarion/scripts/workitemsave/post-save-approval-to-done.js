/**
 * Post-save hook: when every approval row is satisfied (status id "approved"),
 * set the work item workflow status to your terminal / done state.
 *
 * Deploy:
 *   1) Install FMC Work Item Save extension:
 *      https://extensions.polarion.com/extensions/134-fmc-work-it
 *   2) Copy this folder to the Polarion server as:
 *      <POLARION_HOME>/scripts/workitemsave/
 *   3) Rename to match scope (examples):
 *        post-save.js                          → all work item types, all projects
 *        task-post-save.js                     → only type "task"
 *        myproject-task-post-save.js           → project "myproject", type "task"
 *
 * Tuning: replace TARGET_STATUS_ID with the real status id from your workflow
 * (Administration → Workflow → Statuses), e.g. "done", "approved", "closed".
 *
 * Polarion runs this in Rhino (server-side). No browser APIs (XHR, window, etc.).
 */

var TARGET_STATUS_ID = "done";
var APPROVAL_GRANTED_ID = "approved";

function allApprovalRowsApproved(wi) {
    var approvals = wi.getApprovals();
    if (approvals == null || approvals.isEmpty()) {
        return false;
    }
    var it = approvals.iterator();
    while (it.hasNext()) {
        var row = it.next();
        var st = row.getStatus();
        if (st == null || st.getId() != APPROVAL_GRANTED_ID) {
            return false;
        }
    }
    return true;
}

var current = workItem.getStatus();
if (current != null && current.getId() == TARGET_STATUS_ID) {
    // Already at target; avoids extra saves after we transition.
} else if (allApprovalRowsApproved(workItem)) {
    try {
        workItem.setEnumerationValue("status", TARGET_STATUS_ID);
        workItem.save();
    } catch (e) {
        // Direct status jumps may be blocked by workflow. If this throws, use a
        // workflow Script Function + performAction(...) instead, or add a legal
        // transition from the current state to TARGET_STATUS_ID.
        java.lang.System.err.println(
            "[post-save-approval-to-done] " + workItem.getUri() + " : " + e
        );
    }
}
