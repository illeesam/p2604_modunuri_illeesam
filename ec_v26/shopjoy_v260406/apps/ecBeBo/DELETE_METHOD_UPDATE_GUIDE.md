# Delete Method Update Guide — 2026-04-28

## Overview

Update all 174 BO/FO service delete() methods from the old pattern to the new pattern per CLAUDE.md requirements.

## Current Status

**Manually Updated (9 files)**:
1. BoSyUserService.java ✓
2. BoSyRoleService.java ✓
3. BoSyMenuService.java ✓
4. BoStSettleConfigService.java ✓
5. BoStSettleAdjService.java ✓
6. BoStSettleService.java ✓
7. BoStSettleCloseService.java ✓
8. BoStSettlePayService.java ✓
9. BoStSettleRawService.java ✓

**Remaining: 165 files** (across BO 54 + FO 10 + base 100+ services)

## Old Pattern (Current)

```java
@Transactional
public void delete(String id) {
    if (!repository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
    repository.deleteById(id);
    em.flush();
    // optional: cache operations
}
```

## New Pattern (Required)

```java
@Transactional
public void delete(String id) {
    XxxEntity entity = repository.findById(id)
        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    repository.delete(entity);
    em.flush();
    if (repository.existsById(id))
        throw new CmBizException("데이터 삭제에 실패했습니다.");
    // optional: cache operations (if present, add after validation check)
}
```

## Key Changes

1. **Replace existsById + deleteById** → **findById + orElseThrow + delete(entity)**
2. **Add deletion validation** → Check existsById after delete, throw if still exists
3. **Preserve cache operations** → Move cache.evictAll() calls to after the validation check
4. **Maintain em.flush()** → Keep the flush call

## Implementation Approach

### Option A: Python Script (Recommended)

Execute the provided `update_delete_methods.py` script:

```bash
cd c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi
python3 update_delete_methods.py
```

**Advantages**:
- Updates all 165 remaining files in seconds
- Automatically detects entity type from repository declaration
- Preserves cache operations
- Regex-based, handles variations

**Requirements**:
- Python 3.6+
- UTF-8 file encoding

### Option B: Manual IDE Refactoring

Use IDE's Find & Replace with regex:

**Find**:
```
@Transactional\s+public void delete\(String id\)\s*\{[^}]*\}
```

**Replace**: (case-by-case per service)
```java
@Transactional
public void delete(String id) {
    XxxEntity entity = repository.findById(id)
        .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    repository.delete(entity);
    em.flush();
    if (repository.existsById(id))
        throw new CmBizException("데이터 삭제에 실패했습니다.");
}
```

Replace `XxxEntity` with actual entity type from each file.

### Option C: Batch Git Workflow

1. Commit current changes
2. Run Python script
3. Review all changes: `git diff`
4. Verify compilation: `./gradlew clean build`
5. Commit: "Update all delete() methods to use new pattern"

## Entity Type Detection

Most services follow naming convention:
- `private final XxxRepository repository;` → Entity type is `Xxx`

Examples:
- `SyUserRepository` → `SyUser`
- `StSettleRepository` → `StSettle`
- `PmCouponRepository` → `PmCoupon`

## Files to Update (Remaining 165)

### BO Services (45 remaining)

**ec/st** (1 remaining):
- BoStSettleEtcAdjService.java

**ec/pm** (8):
- BoPmDiscntService.java
- BoPmCacheService.java
- BoPmVoucherService.java
- BoPmSaveService.java
- BoPmPlanService.java
- BoPmGiftService.java
- BoPmEventService.java
- BoPmCouponService.java

**ec/pd** (8):
- BoPdRestockNotiService.java
- BoPdTagService.java
- BoPdReviewService.java
- BoPdQnaService.java
- BoPdProdService.java
- BoPdDlivTmpltService.java
- BoPdCategoryService.java
- BoPdCategoryProdService.java (if exists)

**ec/od** (3):
- BoOdOrderService.java
- BoOdDlivService.java
- BoOdClaimService.java

**ec/mb** (4):
- BoMbMemGradeService.java
- BoMbMemberService.java
- BoMbCustInfoService.java
- BoMbMemGroupService.java

**ec/dp** (5):
- BoDpWidgetService.java
- BoDpWidgetLibService.java
- BoDpUiService.java
- BoDpPanelService.java
- BoDpAreaService.java

**ec/cm** (2):
- BoCmChattService.java
- BoCmBlogService.java

**sy** (10):
- BoSyDeptService.java
- BoSyContactService.java
- BoSyBbsService.java
- BoSyBbmService.java
- BoSyBatchService.java
- BoSyAttachService.java
- BoSyAlarmService.java
- BoSyBrandService.java
- BoSyCodeService.java
- BoSyUserRoleService.java
- BoSyVendorService.java
- BoSyTemplateService.java
- BoSySiteService.java

### Base Services (100+ remaining)

**base/sy** (30+):
- SyDeptService.java
- SyVocService.java
- SyVendorUserService.java
- SyVendorContentService.java
- SyVendorService.java
- SyVendorBrandService.java
- SyUserRoleService.java
- SyUserService.java
- SySiteService.java
- SyTemplateService.java
- SyRoleService.java
- SyPropService.java
- SyRoleMenuService.java
- SyNoticeService.java
- SyI18nService.java
- SyMenuService.java
- SyI18nMsgService.java
- SyContactService.java
- SyCodeService.java
- SyBrandService.java
- SyCodeGrpService.java
- SyBbmService.java
- SyBbsService.java
- SyAttachService.java
- SyBatchService.java
- SyAlarmService.java
- SyAttachGrpService.java
- ZzSample0Service.java
- ZzSample1Service.java
- ZzSample2Service.java

**base/ec/st** (10):
- StSettleService.java
- StSettlePayService.java
- StSettleRawService.java
- StSettleEtcAdjService.java
- StSettleItemService.java
- StSettleCloseService.java
- StSettleConfigService.java
- StReconService.java
- StSettleAdjService.java
- StErpVoucherService.java
- StErpVoucherLineService.java

**base/ec/pm** (20+):
- PmVoucherService.java
- PmSaveUsageService.java
- PmVoucherIssueService.java
- PmSaveItemService.java
- PmSaveService.java
- PmPlanService.java
- PmSaveIssueService.java
- PmGiftService.java
- PmPlanItemService.java
- PmGiftCondService.java
- PmGiftIssueService.java
- PmEventService.java
- PmEventBenefitService.java
- PmEventItemService.java
- PmDiscntUsageService.java
- PmDiscntItemService.java
- PmDiscntService.java
- PmCouponUsageService.java
- PmCouponItemService.java
- PmCouponService.java
- PmCacheService.java
- PmCouponIssueService.java

**base/ec/pd** (30+):
- PdTagService.java
- PdReviewCommentService.java
- PdReviewService.java
- PdReviewAttachService.java
- PdProdTagService.java
- PdRestockNotiService.java
- PdProdSetItemService.java
- PdProdSkuService.java
- PdProdRelService.java
- PdProdService.java
- PdProdOptService.java
- PdProdQnaService.java
- PdProdOptItemService.java
- PdProdContentService.java
- PdProdImgService.java
- PdProdBundleItemService.java
- PdDlivTmpltService.java
- PdCategoryProdService.java
- PdCategoryService.java

**base/ec/od** (15+):
- OdRefundService.java
- OdPayService.java
- OdRefundMethodService.java
- OdOrderService.java
- OdPayMethodService.java
- OdOrderItemDiscntService.java
- OdOrderItemService.java
- OdOrderDiscntService.java
- OdDlivService.java
- OdDlivItemService.java
- OdClaimItemService.java
- OdClaimService.java
- OdCartService.java

**base/ec/mb** (7):
- MbMemberService.java
- MbMemberSnsService.java
- MbMemberGradeService.java
- MbMemberGroupService.java
- MbMemberAddrService.java
- MbDeviceTokenService.java
- MbLikeService.java

**base/ec/dp** (7):
- DpWidgetService.java
- DpUiService.java
- DpWidgetLibService.java
- DpPanelService.java
- DpUiAreaService.java
- DpAreaService.java
- DpPanelItemService.java

**base/ec/cm** (8):
- CmPathService.java
- DpAreaPanelService.java
- CmChattRoomService.java
- CmChattMsgService.java
- CmBlogService.java
- CmBlogTagService.java
- CmBlogReplyService.java
- CmBlogFileService.java
- CmBlogGoodService.java
- CmBlogCateService.java

### FO Services (2 remaining)

**fo/ec** (2):
- FoMyPageService.java (already uses new pattern at line 122-130)
- FoCmBlogService.java

## Verification Checklist

After updates, verify:

- [ ] All 174 files compile without syntax errors
- [ ] No "Null type safety" warnings from IDE
- [ ] All delete methods use `repository.delete(entity)` not `deleteById(id)`
- [ ] All delete methods check existence after deletion
- [ ] Cache operations preserved (if any)
- [ ] `em.flush()` calls maintained
- [ ] Git diff shows consistent pattern across all files

## References

- CLAUDE.md line ~120: "delete - 존재 확인"
- EcAdminApi/CLAUDE.md: CRUD patterns section
- Completed examples: BoSyUserService.java, BoSyRoleService.java

## Commands

### Run Python script:
```bash
cd c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_apps/EcAdminApi
python3 update_delete_methods.py
```

### Verify changes:
```bash
git diff --name-only | wc -l  # Should show ~165 files
git diff src/main/java | grep -c "public void delete"  # Should show ~330 (old + new)
```

### Build and test:
```bash
./gradlew clean build
./gradlew test
```

## Notes

- Null type safety warnings are IDE annotations (@NonNull). They don't affect runtime.
- Some services have additional business logic in delete (e.g., cache eviction). Preserve these after validation.
- Entity type is always extracted from `private final XxxRepository repository` field.

## Contact

For issues or questions, refer to the script comments or the CLAUDE.md guidelines.
