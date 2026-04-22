package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdSetItemMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSetItemRepository;
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

@Service
@RequiredArgsConstructor
public class PdProdSetItemService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdProdSetItemMapper mapper;
    private final PdProdSetItemRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdSetItemDto getById(String id) {
        PdProdSetItemDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdSetItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PdProdSetItemDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdSetItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdSetItem entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdSetItem create(PdProdSetItem entity) {
        entity.setSetItemId(generateId());
        entity.setRegBy(SecurityUtil.getUserId());
        entity.setRegDate(LocalDateTime.now());
        PdProdSetItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdSetItem save(PdProdSetItem entity) {
        if (!repository.existsById(entity.getSetItemId()))
            throw new CmBizException("존재하지 않는 PdProdSetItem입니다: " + entity.getSetItemId());
        entity.setUpdBy(SecurityUtil.getUserId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdSetItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdSetItem입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=PRSI (pd_prod_set_item) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "PRSI" + ts + rand;
    }
}
