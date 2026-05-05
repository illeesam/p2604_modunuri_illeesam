package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaimItem;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdClaimItemMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimItemRepository;
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
public class OdClaimItemService {

    private final OdClaimItemMapper odClaimItemMapper;
    private final OdClaimItemRepository odClaimItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdClaimItemDto getById(String id) {
        OdClaimItemDto result = odClaimItemMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdClaimItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdClaimItemDto> result = odClaimItemMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdClaimItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odClaimItemMapper.selectPageList(p), odClaimItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdClaimItem entity) {
        int result = odClaimItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdClaimItem create(OdClaimItem entity) {
        entity.setClaimItemId(CmUtil.generateId("od_claim_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaimItem result = odClaimItemRepository.save(entity);
        return result;
    }

    @Transactional
    public OdClaimItem save(OdClaimItem entity) {
        if (!odClaimItemRepository.existsById(entity.getClaimItemId()))
            throw new CmBizException("존재하지 않는 OdClaimItem입니다: " + entity.getClaimItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaimItem result = odClaimItemRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!odClaimItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdClaimItem입니다: " + id);
        odClaimItemRepository.deleteById(id);
    }
    @Transactional
    public void saveList(List<OdClaimItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdClaimItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setClaimItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_claim_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odClaimItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getClaimItemId(), "claimItemId must not be null");
                OdClaimItem entity = odClaimItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "claimItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odClaimItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getClaimItemId(), "claimItemId must not be null");
                if (odClaimItemRepository.existsById(id)) odClaimItemRepository.deleteById(id);
            }
        }
    }
}