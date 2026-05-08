package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdPayMethodMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdPayMethodRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OdPayMethodService {

    private final OdPayMethodMapper odPayMethodMapper;
    private final OdPayMethodRepository odPayMethodRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdPayMethodDto getById(String id) {
        OdPayMethodDto result = odPayMethodMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdPayMethodDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdPayMethodDto> result = odPayMethodMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdPayMethodDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odPayMethodMapper.selectPageList(p), odPayMethodMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdPayMethod entity) {
        int result = odPayMethodMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdPayMethod create(OdPayMethod entity) {
        entity.setPayMethodId(CmUtil.generateId("od_pay_method"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPayMethod result = odPayMethodRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdPayMethod save(OdPayMethod entity) {
        if (!odPayMethodRepository.existsById(entity.getPayMethodId()))
            throw new CmBizException("존재하지 않는 OdPayMethod입니다: " + entity.getPayMethodId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPayMethod result = odPayMethodRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odPayMethodRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdPayMethod입니다: " + id);
        odPayMethodRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdPayMethod> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdPayMethod row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setPayMethodId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_pay_method"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odPayMethodRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getPayMethodId(), "payMethodId must not be null");
                OdPayMethod entity = odPayMethodRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "payMethodId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odPayMethodRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getPayMethodId(), "payMethodId must not be null");
                if (odPayMethodRepository.existsById(id)) odPayMethodRepository.deleteById(id);
            }
        }
    }
}