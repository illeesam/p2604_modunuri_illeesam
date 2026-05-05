package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPay;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdPayMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdPayRepository;
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
public class OdPayService {

    private final OdPayMapper odPayMapper;
    private final OdPayRepository odPayRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdPayDto getById(String id) {
        OdPayDto result = odPayMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdPayDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdPayDto> result = odPayMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdPayDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odPayMapper.selectPageList(p), odPayMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdPay entity) {
        int result = odPayMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdPay create(OdPay entity) {
        entity.setPayId(CmUtil.generateId("od_pay"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPay result = odPayRepository.save(entity);
        return result;
    }

    @Transactional
    public OdPay save(OdPay entity) {
        if (!odPayRepository.existsById(entity.getPayId()))
            throw new CmBizException("존재하지 않는 OdPay입니다: " + entity.getPayId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdPay result = odPayRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!odPayRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdPay입니다: " + id);
        odPayRepository.deleteById(id);
    }
    @Transactional
    public void saveList(List<OdPay> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdPay row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setPayId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_pay"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odPayRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getPayId(), "payId must not be null");
                OdPay entity = odPayRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "payId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odPayRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getPayId(), "payId must not be null");
                if (odPayRepository.existsById(id)) odPayRepository.deleteById(id);
            }
        }
    }
}