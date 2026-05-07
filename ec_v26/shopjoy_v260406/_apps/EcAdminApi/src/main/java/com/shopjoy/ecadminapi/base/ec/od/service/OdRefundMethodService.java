package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdRefundMethodMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdRefundMethodRepository;
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
public class OdRefundMethodService {

    private final OdRefundMethodMapper odRefundMethodMapper;
    private final OdRefundMethodRepository odRefundMethodRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdRefundMethodDto getById(String id) {
        OdRefundMethodDto result = odRefundMethodMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<OdRefundMethodDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdRefundMethodDto> result = odRefundMethodMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<OdRefundMethodDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odRefundMethodMapper.selectPageList(p), odRefundMethodMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdRefundMethod entity) {
        int result = odRefundMethodMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdRefundMethod create(OdRefundMethod entity) {
        entity.setRefundMethodId(CmUtil.generateId("od_refund_method"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefundMethod result = odRefundMethodRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdRefundMethod save(OdRefundMethod entity) {
        if (!odRefundMethodRepository.existsById(entity.getRefundMethodId()))
            throw new CmBizException("존재하지 않는 OdRefundMethod입니다: " + entity.getRefundMethodId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefundMethod result = odRefundMethodRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odRefundMethodRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdRefundMethod입니다: " + id);
        odRefundMethodRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdRefundMethod> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdRefundMethod row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setRefundMethodId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_refund_method"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odRefundMethodRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getRefundMethodId(), "refundMethodId must not be null");
                OdRefundMethod entity = odRefundMethodRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "refundMethodId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odRefundMethodRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getRefundMethodId(), "refundMethodId must not be null");
                if (odRefundMethodRepository.existsById(id)) odRefundMethodRepository.deleteById(id);
            }
        }
    }
}