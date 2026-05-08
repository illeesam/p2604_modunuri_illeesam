package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderItemMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderItemRepository;
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
public class OdOrderItemService {

    private final OdOrderItemMapper odOrderItemMapper;
    private final OdOrderItemRepository odOrderItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdOrderItemDto getById(String id) {
        OdOrderItemDto result = odOrderItemMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdOrderItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdOrderItemDto> result = odOrderItemMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdOrderItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odOrderItemMapper.selectPageList(p), odOrderItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdOrderItem entity) {
        int result = odOrderItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdOrderItem create(OdOrderItem entity) {
        entity.setOrderItemId(CmUtil.generateId("od_order_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItem result = odOrderItemRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdOrderItem save(OdOrderItem entity) {
        if (!odOrderItemRepository.existsById(entity.getOrderItemId()))
            throw new CmBizException("존재하지 않는 OdOrderItem입니다: " + entity.getOrderItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItem result = odOrderItemRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odOrderItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdOrderItem입니다: " + id);
        odOrderItemRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdOrderItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdOrderItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setOrderItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_order_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odOrderItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getOrderItemId(), "orderItemId must not be null");
                OdOrderItem entity = odOrderItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "orderItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odOrderItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getOrderItemId(), "orderItemId must not be null");
                if (odOrderItemRepository.existsById(id)) odOrderItemRepository.deleteById(id);
            }
        }
    }
}