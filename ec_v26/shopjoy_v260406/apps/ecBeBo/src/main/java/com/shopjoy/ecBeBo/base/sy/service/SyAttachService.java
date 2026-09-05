package com.shopjoy.ecBeBo.base.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.AttachFile;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyAttach;
import com.shopjoy.ecBeBo.base.sy.repository.SyAttachRepository;
import com.shopjoy.ecBeBo.co.ext.cdn.CfCdnApiClient;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.FileUploadUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyAttachService {

    private final SyAttachRepository syAttachRepository;
    private final FileUploadUtil fileUploadUtil;
    private final CfCdnApiClient cfCdnApiClient;

    @PersistenceContext
    private EntityManager em;

    /* 첨부파일 키조회 */
    public SyAttachDto.Item getById(String id) {
        // [QueryDSL] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 단건 조회
        SyAttachDto.Item dto = syAttachRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAttachDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 단건 조회
        return syAttachRepository.selectById(id).orElse(null);
    }

    /* 첨부파일 상세조회 */
    public SyAttach findById(String id) {
        // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 단건 조회
        return syAttachRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAttach findByIdOrNull(String id) {
        // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 단건 조회
        return syAttachRepository.findById(id).orElse(null);
    }

    /* 첨부파일 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 존재 여부 확인
        return syAttachRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 존재 여부 확인
        if (!syAttachRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 첨부파일 목록조회 */
    public List<SyAttachDto.Item> getList(SyAttachDto.Request req) {
        // [QueryDSL] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 목록 조회
        return syAttachRepository.selectList(req);
    }

    /* 첨부파일 페이지조회 */
    public BasePage<SyAttachDto.Item> getPageData(SyAttachDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 페이지 조회
        return syAttachRepository.selectPageData(req);
    }

    /* 첨부파일 등록 */
    @Transactional
    public SyAttach create(SyAttach body) {
        body.setAttachId(CmUtil.generateId("sy_attach"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 저장
        SyAttach saved = syAttachRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 첨부파일 수정 */
    @Transactional
    public SyAttach update(String id, SyAttach body) {
        CmUtil.requireId(id, "id", this);
        SyAttach entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "attachId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 저장
        SyAttach saved = syAttachRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 첨부파일 수정 */
    @Transactional
    public SyAttach updateSelective(SyAttach entity) {
        if (entity.getAttachId() == null) throw new CmBizException("attachId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getAttachId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 선택적 필드 수정
        int affected = syAttachRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /**
     * 첨부파일 연계 변경사항(등록 시 추가 / 목록에서 삭제) 일괄 반영.
     *
     * <p>업로드·삭제 버튼 클릭은 화면에서 즉시 물리 반영되지만, sy_attach 의 ref_table_nm/ref_id
     * "연계" 자체는 이 메서드를 통해서만 반영된다 — 대상 레코드(공지/게시글/문의 등)를 저장하는
     * 업무 Service 의 create()/update() 가, 레코드 저장이 확정된 직후 같은 트랜잭션 안에서 호출해야
     * 한다. 별도 API 호출에 의존하면 그 호출이 누락되거나 실패했을 때 연계가 영구히 어긋나는 문제가
     * 있어(2026-08-15), 저장 주체가 되는 업무 Service 가 직접 호출하는 것을 표준으로 한다.</p>
     *
     * <p>rowStatus 'I' = ref_table_nm/ref_id 주입(연계), 'D' = 연계 삭제(물리 삭제 포함).
     * 'U'(부가정보 수정)는 아직 처리 항목이 없다 — 추후 보완.</p>
     *
     * <p>이 메서드는 DB 반영만 한다 — 저장 응답에 첨부 리소스 정보(파일명/URL/크기 등)를 실어 보내려면
     * 호출 직후 {@link #getAttachFilesByRef} 로 최신 목록을 다시 읽어 같은 필드({@code attachFiles},
     * 2번째 슬롯은 {@code attach2Files})를 덮어쓴다. 요청/응답이 같은 필드 하나를 공유한다. §10-A/§10-B.</p>
     */
    @Transactional
    public void applyChanges(List<AttachFile> changes, String refTableNm, String refId) {
        if (changes == null || changes.isEmpty()) return;
        if (refTableNm == null || refTableNm.isBlank() || refId == null || refId.isBlank())
            throw new CmBizException("refTableNm/refId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        for (AttachFile c : changes) {
            if (c == null || c.getAttachId() == null || c.getAttachId().isBlank()) continue;
            if ("I".equals(c.getRowStatus())) {
                SyAttach patch = SyAttach.builder().attachId(c.getAttachId()).refTableNm(refTableNm).refId(refId).build();
                updateSelective(patch);
            } else if ("D".equals(c.getRowStatus())) {
                delete(c.getAttachId());
            }
            // 'U' 예약 — 향후 부가정보(설명/정렬순서 등) 수정
        }
    }

    /**
     * refTableNm/refId 로 연계된 첨부파일들을 {@link AttachFile} 목록으로 반환.
     * 다른 도메인 Service 가 저장 후 응답의 {@code attachFiles} 필드에 그대로 싣는 용도(§10-A).
     */
    public List<AttachFile> getAttachFilesByRef(String refTableNm, String refId) {
        if (refTableNm == null || refTableNm.isBlank() || refId == null || refId.isBlank()) return List.of();
        return syAttachRepository
            .findByRefTableNmAndRefIdInOrderByRefIdAscSortOrdAscAttachIdAsc(refTableNm, List.of(refId))
            .stream().map(this::toAttachFile).toList();
    }

    /** SyAttach → 요청/응답 공유용 축약 항목 (필드명은 sy_attach 컬럼 그대로).
     *  rowStatus 는 응답 조회 시점엔 의미가 없어(연계 변경 요청이 아니므로) 기본값 "N" 으로 채운다. */
    public AttachFile toAttachFile(SyAttach a) {
        AttachFile f = new AttachFile();
        f.setAttachId(a.getAttachId());
        f.setRowStatus("N");
        f.setRefTableNm(a.getRefTableNm());
        f.setRefId(a.getRefId());
        f.setFileNm(a.getFileNm());
        f.setFileExt(a.getFileExt());
        f.setFileSize(a.getFileSize());
        f.setAttachUrl(a.getAttachUrl());
        f.setThumbUrl(a.getThumbUrl());
        f.setCdnImgUrl(a.getCdnImgUrl());
        f.setThumbCdnUrl(a.getThumbCdnUrl());
        f.setStoragePath(a.getStoragePath());
        f.setSortOrd(a.getSortOrd());
        return f;
    }

    /**
     * SyAttach → {@link SyAttachDto.Brief} (다른 도메인 DTO 가 읽기 전용 목록/상세 조회에서 물고 가는
     * 축약 항목, §10). {@link #toAttachFile} 과 필드는 거의 같지만 rowStatus 개념이 없는 순수
     * 읽기용이라 별도로 둔다 — 저장 요청/응답을 공유하는 {@code attachFiles} 필드에는 {@link AttachFile}
     * 을 쓴다(§10-A).
     */
    public SyAttachDto.Brief toBrief(SyAttach a) {
        SyAttachDto.Brief b = new SyAttachDto.Brief();
        b.setAttachId(a.getAttachId());
        b.setFileNm(a.getFileNm());
        b.setFileExt(a.getFileExt());
        b.setFileSize(a.getFileSize());
        b.setAttachUrl(a.getAttachUrl());
        b.setThumbUrl(a.getThumbUrl());
        b.setCdnImgUrl(a.getCdnImgUrl());
        b.setThumbCdnUrl(a.getThumbCdnUrl());
        b.setStoragePath(a.getStoragePath());
        b.setSortOrd(a.getSortOrd());
        return b;
    }

    /**
     * 첨부파일 삭제 — DB 행 + 실제 물리 파일.
     * DB 행만 지우고 물리 파일을 남겨두면 attach_id 를 잃어버려 다시는 못 지우는 완전한 고아 파일이
     * 된다(ATTACH_CLEANUP 배치도 sy_attach 행을 기준으로 스캔하므로 대상에서도 빠진다) — 2026-08-15.
     */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyAttach entity = findById(id);
        String storageTypeCd = entity.getStorageTypeCd();
        String storagePath = entity.getStoragePath();
        // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 삭제
        syAttachRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        if (storagePath == null) return;
        // 2026-09-06: storage_type_cd=CDN 행은 storagePath 에 로컬 경로가 아니라 EcCdnApi 의
        // fileId 가 들어있다(CmUploadService.uploadMulti() CDN 분기 참조) — 로컬 파일 삭제 대신
        // EcCdnApi 에 원본+썸네일+프레임 일괄 삭제를 요청한다.
        if ("CDN".equalsIgnoreCase(storageTypeCd)) {
            try {
                cfCdnApiClient.delete(storagePath);
            } catch (Exception e) {
                log.warn("EcCdnApi 파일 삭제 실패 (계속 진행 — 고아 파일로 남을 수 있음): fileId={}", storagePath, e);
            }
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(fileUploadUtil.toPhysicalPath(storagePath)));
        } catch (Exception e) {
            log.warn("실제 파일 삭제 실패 (계속 진행): {}", storagePath, e);
        }
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyAttach saveOneBase(SyAttach entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getAttachId());

        if ("D".equals(rowStatus)) {
            if (entity.getAttachId() == null)
                throw new CmBizException("삭제 대상 attachId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 존재 여부 확인
            if (!syAttachRepository.existsById(entity.getAttachId()))
                throw new CmBizException("존재하지 않는 SyAttach입니다: " + entity.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 ID 기준 삭제
            syAttachRepository.deleteById(entity.getAttachId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setAttachId(CmUtil.generateId("sy_attach"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 저장
            SyAttach saved = syAttachRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getAttachId() == null)
                throw new CmBizException("수정 대상 attachId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 선택적 필드 수정
            int affected = syAttachRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyAttach입니다: " + entity.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getAttachId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<SyAttach> rows) {
        /* 0단계: rowStatus 정규화 */
        for (SyAttach row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getAttachId() == null || row.getAttachId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SyAttach::getAttachId, "U", "attachId", this);
        CmUtil.requireRowIds(rows, SyAttach::getAttachId, "D", "attachId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SyAttach::getAttachId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 조건별 삭제
            syAttachRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SyAttach> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyAttach row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 선택적 필드 수정
            int affected = syAttachRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<SyAttach> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAttach row : insertRows) {
            row.setAttachId(CmUtil.generateId("sy_attach"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 첨부파일 정보 - 모든 도메인에서 업로드된 파일의 메타데이터 중앙 관리 저장
            syAttachRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
