#!/usr/bin/env python3
"""
Update all service delete() methods to use the new pattern:
- findById + orElseThrow
- delete(entity) instead of deleteById(id)
- flush
- existsById check
"""
import os
import re
from pathlib import Path

# Service files to update (from grep output)
SERVICE_FILES = [
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/st/service/BoStSettleService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/st/service/BoStSettleRawService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/st/service/BoStSettlePayService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/st/service/BoStSettleEtcAdjService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/st/service/BoStSettleCloseService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/st/service/BoStSettleAdjService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmDiscntService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmCacheService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmVoucherService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmSaveService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmPlanService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmGiftService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmEventService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pm/service/BoPmCouponService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pd/service/BoPdRestockNotiService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pd/service/BoPdTagService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pd/service/BoPdReviewService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pd/service/BoPdQnaService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pd/service/BoPdProdService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pd/service/BoPdDlivTmpltService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/od/service/BoOdOrderService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/od/service/BoOdDlivService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/od/service/BoOdClaimService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyDeptService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyContactService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyBbsService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyBbmService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyBatchService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyAttachService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyAlarmService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyBrandService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyCodeService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/pd/service/BoPdCategoryService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/mb/service/BoMbMemGroupService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/mb/service/BoMbCustInfoService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/dp/service/BoDpWidgetService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/dp/service/BoDpWidgetLibService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/dp/service/BoDpUiService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/dp/service/BoDpPanelService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/dp/service/BoDpAreaService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/cm/service/BoCmChattService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/cm/service/BoCmBlogService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/mb/service/BoMbMemGradeService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/cm/service/BoCmNoticeService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/ec/mb/service/BoMbMemberService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyDeptService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyUserRoleService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyVendorService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSyTemplateService.java",
    "src/main/java/com/shopjoy/ecadminapi/bo/sy/service/BoSySiteService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyVocService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/ZzSample0Service.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyVendorUserService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyVendorContentService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyVendorService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyVendorBrandService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyUserRoleService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyUserService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SySiteService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyTemplateService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyRoleService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyPropService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyRoleMenuService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyNoticeService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyI18nService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyMenuService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyI18nMsgService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyContactService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyCodeService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyBrandService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyCodeGrpService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyBbmService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyBbsService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyAttachService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyBatchService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyAlarmService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/sy/service/SyAttachGrpService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettleService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettlePayService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettleRawService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettleEtcAdjService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettleItemService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettleCloseService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettleConfigService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StReconService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StSettleAdjService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StErpVoucherService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/pm/service/PmVoucherService.java",
    "src/main/java/com/shopjoy/ecadminapi/base/ec/st/service/StErpVoucherLineService.java",
]

def extract_entity_type(content):
    """Extract entity type from repository declaration"""
    match = re.search(r'private final (\w+)Repository\s+repository', content)
    if match:
        return match.group(1)
    return None

def update_delete_method(file_path):
    """Update delete method in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has delete method
        if 'public void delete(String id)' not in content:
            return None

        # Extract entity type
        entity_type = extract_entity_type(content)
        if not entity_type:
            return "FAILED_NO_ENTITY"

        # Pattern for the old delete method
        old_pattern = r'@Transactional\s+public void delete\(String id\)\s*\{[^}]*\}'

        def replace_func(match):
            old_text = match.group(0)
            # Check for cache operations
            has_cache = 'Cache' in old_text or 'cache' in old_text.lower()
            cache_ops = ""

            if has_cache:
                # Extract cache operations
                cache_match = re.search(r'(.*Cache.*(?:\n.*)*)', old_text, re.MULTILINE)
                if cache_match:
                    cache_line = cache_match.group(1).strip()
                    # Get all lines after em.flush()
                    lines = old_text.split('\n')
                    cache_lines = []
                    found_flush = False
                    for line in lines:
                        if 'em.flush()' in line:
                            found_flush = True
                        elif found_flush and line.strip() and not line.strip().startswith('}'):
                            cache_lines.append(line)
                    if cache_lines:
                        cache_ops = '\n        ' + '\n        '.join([l.strip() for l in cache_lines])

            return f'''@Transactional
    public void delete(String id) {{
        {entity_type} entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");{cache_ops}
    }}'''

        new_content = re.sub(old_pattern, replace_func, content, flags=re.DOTALL)

        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return "UPDATED"
        return "NO_CHANGE"
    except Exception as e:
        return f"ERROR: {str(e)}"

def main():
    base_dir = Path(__file__).parent
    updated = 0
    failed = 0
    no_change = 0

    for rel_path in SERVICE_FILES:
        file_path = base_dir / rel_path
        if not file_path.exists():
            print(f"SKIP (not found): {rel_path}")
            continue

        result = update_delete_method(str(file_path))
        if result == "UPDATED":
            updated += 1
            print(f"OK: {rel_path}")
        elif result == "NO_CHANGE":
            no_change += 1
        elif result == "SKIP":
            continue
        else:
            failed += 1
            print(f"FAILED ({result}): {rel_path}")

    print(f"\n=== SUMMARY ===")
    print(f"Updated: {updated}")
    print(f"No change: {no_change}")
    print(f"Failed: {failed}")

if __name__ == "__main__":
    main()
