package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpPanelItemMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelItemRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class DpPanelItemService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final DpPanelItemMapper mapper;
    private final DpPanelItemRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpPanelItemDto getById(String id) {
        // dp_panel_item :: select one :: id [orm:mybatis]
        DpPanelItemDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpPanelItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_panel_item :: select list :: p [orm:mybatis]
        List<DpPanelItemDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpPanelItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_panel_item :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpPanelItem entity) {
        // dp_panel_item :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpPanelItem create(DpPanelItem entity) {
        entity.setPanelItemId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // dp_panel_item :: insert or update :: [orm:jpa]
        DpPanelItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpPanelItem save(DpPanelItem entity) {
        if (!repository.existsById(entity.getPanelItemId()))
            throw new CmBizException("존재하지 않는 DpPanelItem입니다: " + entity.getPanelItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_panel_item :: insert or update :: [orm:jpa]
        DpPanelItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpPanelItem입니다: " + id);
        // dp_panel_item :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=PAI (dp_panel_item) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "PAI" + ts + rand;
    }
}
