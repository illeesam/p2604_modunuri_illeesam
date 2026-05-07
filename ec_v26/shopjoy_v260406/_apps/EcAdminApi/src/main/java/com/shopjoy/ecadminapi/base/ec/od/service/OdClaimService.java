package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdClaimMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
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
public class OdClaimService {

    private final OdClaimMapper odClaimMapper;
    private final OdClaimRepository odClaimRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdClaimDto getById(String id) {
        OdClaimDto result = odClaimMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<OdClaimDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdClaimDto> result = odClaimMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<OdClaimDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odClaimMapper.selectPageList(p), odClaimMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdClaim entity) {
        int result = odClaimMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdClaim create(OdClaim entity) {
        entity.setClaimId(CmUtil.generateId("od_claim"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim result = odClaimRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdClaim save(OdClaim entity) {
        if (!odClaimRepository.existsById(entity.getClaimId()))
            throw new CmBizException("존재하지 않는 OdClaim입니다: " + entity.getClaimId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim result = odClaimRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odClaimRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdClaim입니다: " + id);
        odClaimRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdClaim> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdClaim row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setClaimId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_claim"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odClaimRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getClaimId(), "claimId must not be null");
                OdClaim entity = odClaimRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "claimId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odClaimRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getClaimId(), "claimId must not be null");
                if (odClaimRepository.existsById(id)) odClaimRepository.deleteById(id);
            }
        }
    }
}