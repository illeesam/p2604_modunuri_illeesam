package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleItemMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleItemRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
public class StSettleItemService {


    private final StSettleItemMapper stSettleItemMapper;
    private final StSettleItemRepository stSettleItemRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StSettleItemDto getById(String id) {
        StSettleItemDto result = stSettleItemMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StSettleItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StSettleItemDto> result = stSettleItemMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StSettleItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stSettleItemMapper.selectPageList(p), stSettleItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StSettleItem entity) {
        int result = stSettleItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StSettleItem create(StSettleItem entity) {
        entity.setSettleItemId(CmUtil.generateId("st_settle_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleItem result = stSettleItemRepository.save(entity);
        return result;
    }

    @Transactional
    public StSettleItem save(StSettleItem entity) {
        if (!stSettleItemRepository.existsById(entity.getSettleItemId()))
            throw new CmBizException("존재하지 않는 StSettleItem입니다: " + entity.getSettleItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleItem result = stSettleItemRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        StSettleItem entity = stSettleItemRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stSettleItemRepository.delete(entity);
        em.flush();
        if (stSettleItemRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StSettleItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (StSettleItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSettleItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("st_settle_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stSettleItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettleItemId(), "settleItemId must not be null");
                StSettleItem entity = stSettleItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "settleItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                stSettleItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettleItemId(), "settleItemId must not be null");
                if (stSettleItemRepository.existsById(id)) stSettleItemRepository.deleteById(id);
            }
        }
        em.flush();
    }
}