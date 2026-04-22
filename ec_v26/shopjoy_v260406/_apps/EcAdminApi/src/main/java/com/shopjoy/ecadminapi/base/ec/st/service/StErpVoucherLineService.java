package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StErpVoucherLineMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StErpVoucherLineRepository;
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
public class StErpVoucherLineService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final StErpVoucherLineMapper mapper;
    private final StErpVoucherLineRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StErpVoucherLineDto getById(String id) {
        StErpVoucherLineDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StErpVoucherLineDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StErpVoucherLineDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StErpVoucherLineDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StErpVoucherLine entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StErpVoucherLine create(StErpVoucherLine entity) {
        entity.setErpVoucherLineId(generateId());
        entity.setRegBy(SecurityUtil.getUserId());
        entity.setRegDate(LocalDateTime.now());
        StErpVoucherLine result = repository.save(entity);
        return result;
    }

    @Transactional
    public StErpVoucherLine save(StErpVoucherLine entity) {
        if (!repository.existsById(entity.getErpVoucherLineId()))
            throw new CmBizException("존재하지 않는 StErpVoucherLine입니다: " + entity.getErpVoucherLineId());
        entity.setUpdBy(SecurityUtil.getUserId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucherLine result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 StErpVoucherLine입니다: " + id);
        repository.deleteById(id);
    }

    /** ID 생성: prefix=ERVL (st_erp_voucher_line) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "ERVL" + ts + rand;
    }
}
