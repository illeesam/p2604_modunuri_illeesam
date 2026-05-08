package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmGiftMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmGiftService {


    private final PmGiftMapper pmGiftMapper;
    private final PmGiftRepository pmGiftRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PmGiftDto getById(String id) {
        PmGiftDto result = pmGiftMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PmGiftDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmGiftDto> result = pmGiftMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PmGiftDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmGiftMapper.selectPageList(p), pmGiftMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmGift entity) {
        int result = pmGiftMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmGift create(PmGift entity) {
        entity.setGiftId(CmUtil.generateId("pm_gift"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGift result = pmGiftRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmGift save(PmGift entity) {
        if (!pmGiftRepository.existsById(entity.getGiftId()))
            throw new CmBizException("존재하지 않는 PmGift입니다: " + entity.getGiftId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGift result = pmGiftRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmGiftRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmGift입니다: " + id);
        pmGiftRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmGift> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmGift row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setGiftId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_gift"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmGiftRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getGiftId(), "giftId must not be null");
                PmGift entity = pmGiftRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "giftId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmGiftRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getGiftId(), "giftId must not be null");
                if (pmGiftRepository.existsById(id)) pmGiftRepository.deleteById(id);
            }
        }
    }
}