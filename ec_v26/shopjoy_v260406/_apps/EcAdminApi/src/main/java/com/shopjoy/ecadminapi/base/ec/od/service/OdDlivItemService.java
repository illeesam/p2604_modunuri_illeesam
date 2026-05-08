package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdDlivItemMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivItemRepository;
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
public class OdDlivItemService {

    private final OdDlivItemMapper odDlivItemMapper;
    private final OdDlivItemRepository odDlivItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public OdDlivItemDto getById(String id) {
        OdDlivItemDto result = odDlivItemMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<OdDlivItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdDlivItemDto> result = odDlivItemMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<OdDlivItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odDlivItemMapper.selectPageList(p), odDlivItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(OdDlivItem entity) {
        int result = odDlivItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdDlivItem create(OdDlivItem entity) {
        entity.setDlivItemId(CmUtil.generateId("od_dliv_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDlivItem result = odDlivItemRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public OdDlivItem save(OdDlivItem entity) {
        if (!odDlivItemRepository.existsById(entity.getDlivItemId()))
            throw new CmBizException("존재하지 않는 OdDlivItem입니다: " + entity.getDlivItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdDlivItem result = odDlivItemRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!odDlivItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 OdDlivItem입니다: " + id);
        odDlivItemRepository.deleteById(id);
    }
    /** saveList — 저장 */
    @Transactional
    public void saveList(List<OdDlivItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (OdDlivItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setDlivItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("od_dliv_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odDlivItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getDlivItemId(), "dlivItemId must not be null");
                OdDlivItem entity = odDlivItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "dlivItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                odDlivItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getDlivItemId(), "dlivItemId must not be null");
                if (odDlivItemRepository.existsById(id)) odDlivItemRepository.deleteById(id);
            }
        }
    }
}