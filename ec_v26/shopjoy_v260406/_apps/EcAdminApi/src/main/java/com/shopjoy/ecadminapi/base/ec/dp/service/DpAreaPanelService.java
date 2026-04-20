package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpAreaPanelMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaPanelRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DpAreaPanelService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final DpAreaPanelMapper mapper;
    private final DpAreaPanelRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpAreaPanelDto getById(String id) {
        DpAreaPanelDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpAreaPanelDto> getList(Map<String, Object> p) {
        List<DpAreaPanelDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpAreaPanelDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<DpAreaPanelDto> pageList = mapper.selectPageList(p);
        PageResult<DpAreaPanelDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(DpAreaPanel entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpAreaPanel create(DpAreaPanel entity) {
        entity.setAreaPanelId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        DpAreaPanel result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpAreaPanel save(DpAreaPanel entity) {
        if (!repository.existsById(entity.getAreaPanelId()))
            throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + entity.getAreaPanelId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        DpAreaPanel result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=ARP (dp_area_panel) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "ARP" + ts + rand;
    }
}
