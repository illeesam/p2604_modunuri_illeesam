package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdRefundMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdRefundRepository;
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
public class OdRefundService {

    private final OdRefundMapper odRefundMapper;
    private final OdRefundRepository odRefundRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdRefundDto getById(String id) {
        OdRefundDto result = odRefundMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdRefundDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdRefundDto> result = odRefundMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdRefundDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odRefundMapper.selectPageList(p), odRefundMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdRefund entity) {
        int result = odRefundMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdRefund create(OdRefund entity) {
        entity.setRefundId(CmUtil.generateId("od_refund"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefund result = odRefundRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdRefund save(OdRefund entity) {
        if (!odRefundRepository.existsById(entity.getRefundId()))
            throw new CmBizException("존재하지 않는 OdRefund입니다: " + entity.getRefundId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefund result = odRefundRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odRefundRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdRefund입니다: " + id);
        odRefundRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdRefund> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdRefund row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setRefundId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_refund"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odRefundRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getRefundId(), "refundId must not be null");
                OdRefund entity = odRefundRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "refundId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odRefundRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getRefundId(), "refundId must not be null");
                if (odRefundRepository.existsById(id)) odRefundRepository.deleteById(id);
            }
        }
    }
}