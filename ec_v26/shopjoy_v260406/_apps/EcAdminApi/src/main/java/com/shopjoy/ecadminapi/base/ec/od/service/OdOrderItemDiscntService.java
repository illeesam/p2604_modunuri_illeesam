package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderItemDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderItemDiscntRepository;
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
public class OdOrderItemDiscntService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final OdOrderItemDiscntMapper mapper;
    private final OdOrderItemDiscntRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdOrderItemDiscntDto getById(String id) {
        OdOrderItemDiscntDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdOrderItemDiscntDto> getList(Map<String, Object> p) {
        List<OdOrderItemDiscntDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdOrderItemDiscntDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<OdOrderItemDiscntDto> pageList = mapper.selectPageList(p);
        PageResult<OdOrderItemDiscntDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(OdOrderItemDiscnt entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public OdOrderItemDiscnt create(OdOrderItemDiscnt entity) {
        entity.setItemDiscntId(generateId());
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        OdOrderItemDiscnt result = repository.save(entity);
        return result;
    }

    @Transactional
    public OdOrderItemDiscnt save(OdOrderItemDiscnt entity) {
        if (!repository.existsById(entity.getItemDiscntId()))
            throw new CmBizException("존재하지 않는 OdOrderItemDiscnt입니다: " + entity.getItemDiscntId());
        entity.setUpdBy(SecurityUtil.currentUserId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItemDiscnt result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 OdOrderItemDiscnt입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=ORID (od_order_item_discnt) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "ORID" + ts + rand;
    }
}
