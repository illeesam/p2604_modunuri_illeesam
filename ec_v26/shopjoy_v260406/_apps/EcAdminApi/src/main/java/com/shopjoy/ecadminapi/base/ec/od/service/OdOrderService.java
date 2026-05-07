package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
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
public class OdOrderService {

    private final OdOrderMapper odOrderMapper;
    private final OdOrderRepository odOrderRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdOrderDto getById(String id) {
        OdOrderDto result = odOrderMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<OdOrderDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdOrderDto> result = odOrderMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<OdOrderDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odOrderMapper.selectPageList(p), odOrderMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdOrder entity) {
        int result = odOrderMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdOrder create(OdOrder entity) {
        entity.setOrderId(CmUtil.generateId("od_order"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder result = odOrderRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdOrder save(OdOrder entity) {
        if (!odOrderRepository.existsById(entity.getOrderId()))
            throw new CmBizException("존재하지 않는 OdOrder입니다: " + entity.getOrderId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder result = odOrderRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odOrderRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdOrder입니다: " + id);
        odOrderRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdOrder> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdOrder row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setOrderId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_order"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odOrderRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getOrderId(), "orderId must not be null");
                OdOrder entity = odOrderRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "orderId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odOrderRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getOrderId(), "orderId must not be null");
                if (odOrderRepository.existsById(id)) odOrderRepository.deleteById(id);
            }
        }
    }
}